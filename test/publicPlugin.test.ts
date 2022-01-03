import FormData from 'form-data';
import { createReadStream } from 'fs';
import plugin from '../src/publicPlugin';
import { StatusCodes } from 'http-status-codes';
import {
  TaskRunner,
  ItemTaskManager,
  ItemMembershipTaskManager,
} from 'graasp-test';
import build from './app';
import { FILE_PATHS, ITEM_FILE_TXT } from './fixtures';
import { ServiceMethod } from 'graasp-plugin-file';
import {
  CannotEditPublicItem,
  PublicItemTaskManager,
} from 'graasp-plugin-public';
import { buildPublicLocalOptions, buildPublicS3Options } from './fixtures';
import MockTask from 'graasp-test/src/tasks/task';

const itemTaskManager = new ItemTaskManager();
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const publicItemTaskManager = {} as unknown as PublicItemTaskManager;

const buildAppOptions = (options) => ({
  itemTaskManager,
  itemMembershipTaskManager,
  publicItemTaskManager,
  runner,
  plugin,
  options,
});

describe('Options', () => {
  beforeEach(() => {
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(() => true);
    jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(() => true);
  });

  describe('Local', () => {
    it('Valid options should resolve', async () => {
      const app = await build(buildAppOptions(buildPublicLocalOptions()));
      expect(app).toBeTruthy();
    });
  });

  describe('S3', () => {
    it('Valid options should resolve', async () => {
      const app = await build(buildAppOptions(buildPublicS3Options()));
      expect(app).toBeTruthy();
    });
    it('Invalid rootpath should throw', async () => {
      expect(
        async () => await build(buildAppOptions(buildPublicS3Options('/hello')))
      ).rejects.toThrow(Error);
    });
    // cannot check s3 options validity -> enforced with typescript
  });
});

const FILE_SERVICES = [ServiceMethod.LOCAL, ServiceMethod.S3];

const buildFileServiceOptions = (service) => {
  if (service === ServiceMethod.LOCAL) {
    return buildPublicLocalOptions();
  } else if (service === ServiceMethod.S3) {
    return buildPublicS3Options();
  }
  throw new Error('Service is not defined');
};

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:id/download', () => {
    it.each(FILE_SERVICES)(
      '%s : Successfully download public file',
      async (service) => {
        jest
          .spyOn(runner, 'setTaskPreHookHandler')
          .mockImplementation(async () => true);
        jest
          .spyOn(runner, 'setTaskPostHookHandler')
          .mockImplementation(async () => true);

        jest
          .spyOn(TaskRunner.prototype, 'runSingleSequence')
          .mockImplementation(async () => true);
        const mock = jest.fn().mockReturnValue(new MockTask(ITEM_FILE_TXT));

        publicItemTaskManager.createGetPublicItemTask = mock;

        const app = await build(
          buildAppOptions(buildFileServiceOptions(service))
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
      }
    );

    it.each(FILE_SERVICES)(
      '%s : Throw if file is not public',
      async (service) => {
        jest
          .spyOn(runner, 'setTaskPreHookHandler')
          .mockImplementation(async () => true);
        jest
          .spyOn(runner, 'setTaskPostHookHandler')
          .mockImplementation(async () => true);

        jest
          .spyOn(TaskRunner.prototype, 'runSingleSequence')
          .mockImplementation(async () => true);
        const mock = jest.fn().mockReturnValue(new MockTask(new Error()));

        publicItemTaskManager.createGetPublicItemTask = mock;

        const app = await build(
          buildAppOptions(buildFileServiceOptions(service))
        );

        await app.inject({
          method: 'GET',
          url: `/${ITEM_FILE_TXT.id}/download`,
        });

        // check public permission
        expect(mock).toHaveBeenCalledTimes(1);
      }
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

    it.each(FILE_SERVICES)('%s : Upload should throw', async (service) => {
      const app = await build(
        buildAppOptions(buildFileServiceOptions(service))
      );

      const form = new FormData();
      form.append('file', createReadStream(FILE_PATHS[0]));

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        payload: form,
        headers: form.getHeaders(),
      });
      const expectedError = new CannotEditPublicItem({
        mimetype: 'image/jpeg',
      });
      expect(response.json().statusCode).toEqual(expectedError.statusCode);
      expect(response.json().message).toEqual(expectedError.message);
    });
  });
});
