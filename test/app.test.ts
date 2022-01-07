import FormData from 'form-data';
import { createReadStream } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';
import {
  TaskRunner,
  ItemTaskManager,
  ItemMembershipTaskManager,
} from 'graasp-test';
import build from './app';
import plugin from '../src/plugin';
import {
  FILE_PATHS,
  ITEM_FILE_TXT,
  ITEM_FILE_PDF,
  ITEM_FOLDER,
  S3_ITEM_FILE_TXT,
  buildLocalOptions,
  buildS3Options,
  DEFAULT_LOGGER,
} from './fixtures';
import {
  mockCreateCopyFileTask,
  mockCreateDeleteFileTask,
  mockCreateTaskSequence,
  mockGetOfItemTaskSequence,
  mockGetTaskSequence,
} from './mocks';
import {
  ServiceMethod,
  S3FileItemExtra,
  LocalFileItemExtra,
} from 'graasp-plugin-file';

const itemTaskManager = new ItemTaskManager();
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();

const buildAppOptions = (options) => ({
  itemTaskManager,
  itemMembershipTaskManager,
  runner,
  options,
  plugin,
});

describe('Options', () => {
  beforeEach(() => {
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(() => true);
    jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(() => true);
  });

  describe('Local', () => {
    it('Valid options should resolve', async () => {
      const app = await build(buildAppOptions(buildLocalOptions()));
      expect(app).toBeTruthy();
    });
  });

  describe('S3', () => {
    it('Valid options should resolve', async () => {
      const app = await build(buildAppOptions(buildS3Options()));
      expect(app).toBeTruthy();
    });
    it('Invalid rootpath should throw', async () => {
      expect(
        async () => await build(buildAppOptions(buildS3Options('/hello'))),
      ).rejects.toThrow(Error);
    });
    // cannot check s3 options validity -> enforced with typescript
  });
});

const FILE_SERVICES = [ServiceMethod.LOCAL, ServiceMethod.S3];
const DEFAULT_ACTOR = {
  id: v4(),
};

const buildFileServiceOptions = (service) => {
  if (service === ServiceMethod.LOCAL) {
    return buildLocalOptions();
  } else if (service === ServiceMethod.S3) {
    return buildS3Options();
  }
  throw new Error('Service is not defined');
};

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:id/download', () => {
    it.each(FILE_SERVICES)(
      '%s : Successfully download txt file',
      async (service) => {
        jest
          .spyOn(runner, 'setTaskPreHookHandler')
          .mockImplementation(async () => true);
        jest
          .spyOn(runner, 'setTaskPostHookHandler')
          .mockImplementation(async () => true);

        const mock = mockGetTaskSequence(ITEM_FILE_TXT);

        const app = await build(
          buildAppOptions(buildFileServiceOptions(service)),
        );

        const res = await app.inject({
          method: 'GET',
          url: `/${ITEM_FILE_TXT.id}/download`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        // return runSingleSequence mock return value
        expect(res.body).toBeTruthy();

        // download pre hook is run
        expect(mock).toHaveBeenCalledTimes(1);
      },
    );
  });

  describe('POST /upload', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      jest
        .spyOn(runner, 'setTaskPreHookHandler')
        .mockImplementation(async (_name, _fn) => true);
      jest
        .spyOn(runner, 'setTaskPostHookHandler')
        .mockImplementation(async (_name, _fn) => true);
      jest
        .spyOn(runner, 'runMultipleSequences')
        .mockImplementation(async (sequences) => {
          return sequences;
        });
    });

    it.each(FILE_SERVICES)(
      '%s : Uploading single txt file',
      async (service) => {
        const mock = mockCreateTaskSequence(ITEM_FILE_TXT);
        const mockGetPermission = mockGetOfItemTaskSequence(true);

        const app = await build(
          buildAppOptions(buildFileServiceOptions(service)),
        );

        const form = new FormData();
        form.append('file', createReadStream(FILE_PATHS[0]));

        const response = await app.inject({
          method: 'POST',
          url: '/upload',
          payload: form,
          headers: form.getHeaders(),
        });

        expect(response.statusCode).toBe(StatusCodes.OK);
        // at least one sequence is run
        expect(await response.json()?.length).toEqual(1);
        // upload post hook is called
        expect(mock).toHaveBeenCalledTimes(1);
        // upload pre hook is called only if parent id is defined
        expect(mockGetPermission).toHaveBeenCalledTimes(0);
      },
    );

    it.each(FILE_SERVICES)(
      '%s : Uploading single pdf file',
      async (service) => {
        const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
        const mockGetPermission = mockGetOfItemTaskSequence(true);

        const app = await build(
          buildAppOptions(buildFileServiceOptions(service)),
        );

        const form = new FormData();
        form.append('file', createReadStream(FILE_PATHS[0]));

        const response = await app.inject({
          method: 'POST',
          url: '/upload',
          payload: form,
          headers: form.getHeaders(),
        });

        expect(response.statusCode).toBe(StatusCodes.OK);
        // at least one sequence is run
        expect(await response.json()?.length).toEqual(1);
        // upload post hook is called
        expect(mock).toHaveBeenCalledTimes(1);
        // upload pre hook is called only if parent id is defined
        expect(mockGetPermission).toHaveBeenCalledTimes(0);
      },
    );

    it.each(FILE_SERVICES)('%s : Uploading in parent item', async (service) => {
      const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const form = new FormData();
      form.append('file', createReadStream(FILE_PATHS[0]));

      const parentId = v4();

      const response = await app.inject({
        method: 'POST',
        url: `/upload?id=${parentId}`,
        payload: form,
        headers: form.getHeaders(),
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      // at least one sequence is run
      expect(await response.json()?.length).toEqual(1);
      // upload post hook is called
      expect(mock).toHaveBeenCalledTimes(1);
      // upload pre hook is called only if parent id is defined
      expect(mockGetPermission).toHaveBeenCalledTimes(1);
    });

    it.each(FILE_SERVICES)('%s : Upload multiple files', async (service) => {
      const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const form = new FormData();
      form.append('file', createReadStream(FILE_PATHS[0]));
      form.append('file', createReadStream(FILE_PATHS[1]));

      const parentId = v4();

      const response = await app.inject({
        method: 'POST',
        url: `/upload?id=${parentId}`,
        payload: form,
        headers: form.getHeaders(),
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      // at least 2 sequence is run
      expect(await response.json()?.length).toEqual(2);
      // upload post hook is called
      expect(mock).toHaveBeenCalledTimes(2);
      // upload pre hook is called only if parent id is defined
      expect(mockGetPermission).toHaveBeenCalledTimes(2);
    });

    it.each(FILE_SERVICES)(
      '%s : Upload without files should fail',
      async (service) => {
        const app = await build(
          buildAppOptions(buildFileServiceOptions(service)),
        );

        const response = await app.inject({
          method: 'POST',
          url: '/upload',
        });

        expect(response.statusCode).toBe(StatusCodes.NOT_ACCEPTABLE);
      },
    );
  });
});

describe('Hooks', () => {
  describe('Delete Post Hook', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(runner, 'setTaskPreHookHandler')
        .mockImplementation(() => true);
    });

    it('Stop if item is not a file item', async () => {
      jest
        .spyOn(runner, 'setTaskPostHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getDeleteTaskName()) {
            const item = ITEM_FOLDER;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateDeleteFileTask(true);
            await fn(item, actor, { log: DEFAULT_LOGGER });
            expect(fileTaskMock).toHaveBeenCalledTimes(0);
          }
        });
      await build(buildAppOptions(buildLocalOptions()));
    });
    it('Delete corresponding file for file item', async () => {
      jest
        .spyOn(runner, 'setTaskPostHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getDeleteTaskName()) {
            const item = ITEM_FILE_TXT;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateDeleteFileTask(true);
            await fn(item, actor, { log: DEFAULT_LOGGER });
            expect(fileTaskMock).toHaveBeenCalledTimes(1);
          }
        });
      await build(buildAppOptions(buildLocalOptions()));
    });
    it('Delete corresponding file for s3 file item', async () => {
      jest
        .spyOn(runner, 'setTaskPostHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === itemTaskManager.getDeleteTaskName()) {
            const item = S3_ITEM_FILE_TXT;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateDeleteFileTask(true);
            await fn(item, actor, { log: DEFAULT_LOGGER });
            expect(fileTaskMock).toHaveBeenCalledTimes(1);
          }
        });
      await build(buildAppOptions(buildS3Options()));
    });
  });

  describe('Copy Pre Hook', () => {
    const taskName = itemTaskManager.getCopyTaskName();

    beforeEach(() => {
      jest.clearAllMocks();
      jest
        .spyOn(runner, 'setTaskPostHookHandler')
        .mockImplementation(() => true);
    });

    it('Stop if item is not a file item', async () => {
      jest
        .spyOn(runner, 'setTaskPreHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === taskName) {
            const original = ITEM_FOLDER;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateCopyFileTask('newFilePath');
            await fn(original, actor, { log: DEFAULT_LOGGER }, { original });
            expect(fileTaskMock).toHaveBeenCalledTimes(0);
          }
        });
      await build(buildAppOptions(buildLocalOptions()));
    });
    it('Copy corresponding file for file item', async () => {
      jest
        .spyOn(runner, 'setTaskPreHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === taskName) {
            const original = ITEM_FILE_TXT;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateCopyFileTask('newFilePath');
            await fn(original, actor, { log: DEFAULT_LOGGER }, { original });
            expect(fileTaskMock).toHaveBeenCalledTimes(1);
            expect((original.extra.file as LocalFileItemExtra).path).toEqual(
              'newFilePath',
            );
          }
        });
      await build(buildAppOptions(buildLocalOptions()));
    });
    it('Copy corresponding file for s3 file item', async () => {
      jest
        .spyOn(runner, 'setTaskPreHookHandler')
        .mockImplementation(async (name, fn) => {
          if (name === taskName) {
            const original = S3_ITEM_FILE_TXT;
            const actor = DEFAULT_ACTOR;
            const fileTaskMock = mockCreateCopyFileTask('newFilePath');
            await fn(original, actor, { log: DEFAULT_LOGGER }, { original });
            expect(fileTaskMock).toHaveBeenCalledTimes(1);
            expect((original.extra.s3File as S3FileItemExtra).path).toEqual(
              'newFilePath',
            );
          }
        });
      await build(buildAppOptions(buildS3Options()));
    });
  });
});
