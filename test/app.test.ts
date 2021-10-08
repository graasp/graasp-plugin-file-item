import FormData from 'form-data';
import { createReadStream } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { TaskRunner, ItemTaskManager } from 'graasp-test';
import build from './app';
import { ROOT_PATH, FILE_PATHS, ITEM_FILE_TXT, ITEM_FILE_PDF } from './constants';
import { mockCreateTaskSequence, mockGetTaskSequence } from './mocks';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();

describe('Options', () => {
  it('No root path should throw', async () => {
    expect(async () => await build({ taskManager, runner, options: { storageRootPath: '' } })).rejects.toThrow(Error);
  });
});

describe('Plugin Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Options', () => {
    it('Throw an error if no root path is defined', async () => {
      expect(async () => await build({
        taskManager,
        runner,
        options: {
          storageRootPath: ''
        }
      })).rejects.toThrow(Error);
    });
  });

  describe('GET /:id/download', () => {
    it('Successfully download txt file', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => { });
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => { });

      mockGetTaskSequence(ITEM_FILE_TXT);

      const app = await build({
        taskManager,
        runner,
        options: {
          storageRootPath: ROOT_PATH
        }
      });

      const res = await app.inject({
        method: 'GET',
        url: `/${ITEM_FILE_TXT.id}/download`
      });

      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(res.body).toBeTruthy();
    });
    // more exhautstive tests in task
  });

  describe('POST /upload', () => {
    it('Uploading single txt file', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => { });
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => { });

      mockCreateTaskSequence(ITEM_FILE_TXT);

      const app = await build({
        taskManager,
        runner,
      });

      const form = new FormData()
      form.append('file', createReadStream(FILE_PATHS[0]))

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        payload: form,
        headers: form.getHeaders()
      });

      expect(response.statusCode).toBe(StatusCodes.CREATED);
    });

    it('Uploading single pdf file', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => { });
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => { });

      mockCreateTaskSequence(ITEM_FILE_PDF);

      const app = await build({
        taskManager,
        runner,
      });

      const form = new FormData()
      form.append('file', createReadStream(FILE_PATHS[1]))

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        payload: form,
        headers: form.getHeaders()
      });

      expect(response.statusCode).toBe(StatusCodes.CREATED);
    });

    it('Upload multiple files', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => { });
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => { });

      const app = await build({
        taskManager,
        runner,
      });
      const form = new FormData()
      form.append('file', createReadStream(FILE_PATHS[0]))
      form.append('file', createReadStream(FILE_PATHS[1]))

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
        payload: form,
        headers: form.getHeaders()
      });

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
    });

    it('Upload without files should fail', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => { });
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async (name, fn) => { });

      const app = await build({
        taskManager,
        runner,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/upload',
      });

      expect(response.statusCode).toBe(StatusCodes.NOT_ACCEPTABLE);
    });
  });
});
