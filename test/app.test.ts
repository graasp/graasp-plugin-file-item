import FormData from 'form-data';
import fs, { createReadStream } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ItemType, LocalFileItemExtra, S3FileItemExtra } from '@graasp/sdk';
import {
  ItemMembershipTaskManager,
  ItemTaskManager,
  TaskRunner,
} from 'graasp-test';

import plugin from '../src/plugin';
import build from './app';
import {
  DEFAULT_ACTOR,
  DEFAULT_LOGGER,
  FILE_PATHS,
  FILE_SERVICES,
  ITEM_FILE_PDF,
  ITEM_FILE_TXT,
  ITEM_FOLDER,
  S3_ITEM_FILE_TXT,
  buildLocalOptions,
  buildS3Options,
} from './fixtures';
import {
  mockCreateCopyFileTask,
  mockCreateDeleteFileTask,
  mockCreateTaskSequence,
  mockGetOfItemTaskSequence,
  mockGetTaskSequence,
} from './mocks';

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

const filepath = FILE_PATHS[0];
const fileStream = createReadStream(filepath);
jest.spyOn(fs, 'createReadStream').mockImplementation(() => fileStream);

const buildFileServiceOptions = (service) => {
  if (service === ItemType.LOCAL_FILE) {
    return buildLocalOptions();
  } else if (service === ItemType.S3_FILE) {
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

  describe.each(FILE_SERVICES)('POST /upload for %s', (service) => {
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

    const form = new FormData();
    form.append('file', fileStream);
    const form1 = new FormData();
    form1.append('file', fileStream);
    const form2 = new FormData();
    form2.append('file', fileStream);
    const form3 = new FormData();
    form3.append('file', fileStream);
    form3.append('file', createReadStream(FILE_PATHS[1]));

    it('Uploading single txt file', async () => {
      const mock = mockCreateTaskSequence(ITEM_FILE_TXT);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

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
    });

    it('Uploading single pdf file', async () => {
      const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        payload: form1,
        headers: form1.getHeaders(),
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      // at least one sequence is run
      expect(await response.json()?.length).toEqual(1);
      // upload post hook is called
      expect(mock).toHaveBeenCalledTimes(1);
      // upload pre hook is called only if parent id is defined
      expect(mockGetPermission).toHaveBeenCalledTimes(0);
    });

    it('Uploading in parent item', async () => {
      const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const parentId = v4();

      const response = await app.inject({
        method: 'POST',
        url: `/upload?id=${parentId}`,
        payload: form2,
        headers: form2.getHeaders(),
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      // at least one sequence is run
      expect(await response.json()?.length).toEqual(1);
      // upload post hook is called
      expect(mock).toHaveBeenCalledTimes(1);
      // upload pre hook is called only if parent id is defined
      expect(mockGetPermission).toHaveBeenCalledTimes(1);
    });

    it('Upload multiple files', async () => {
      const mock = mockCreateTaskSequence(ITEM_FILE_PDF);
      const mockGetPermission = mockGetOfItemTaskSequence(true);

      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const parentId = v4();

      const response = await app.inject({
        method: 'POST',
        url: `/upload?id=${parentId}`,
        payload: form3,
        headers: form3.getHeaders(),
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      // at least 2 sequence is run
      expect(await response.json()?.length).toEqual(2);
      // upload post hook is called
      expect(mock).toHaveBeenCalledTimes(2);
      // upload pre hook is called only if parent id is defined
      expect(mockGetPermission).toHaveBeenCalledTimes(2);
    });

    it('Upload without files should fail', async () => {
      const app = await build(
        buildAppOptions(buildFileServiceOptions(service)),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
      });

      expect(response.statusCode).toBe(StatusCodes.NOT_ACCEPTABLE);
    });
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
            expect((original.extra?.file as LocalFileItemExtra).path).toEqual(
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
            expect((original.extra?.s3File as S3FileItemExtra).path).toEqual(
              'newFilePath',
            );
          }
        });
      await build(buildAppOptions(buildS3Options()));
    });
  });
});
