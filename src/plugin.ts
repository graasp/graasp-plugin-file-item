/**
 * TODOs:
 * - define schemas for fastify.multipart (?)
 * - improve/add some logging
 */
import fs, { promises as fsPromises } from 'fs';
import { StatusCodes } from 'http-status-codes';

const { mkdir, stat, unlink, copyFile, } = fsPromises;

import { pipeline } from 'stream/promises';

import { FastifyPluginAsync } from 'fastify';
import fastifyMultipart from 'fastify-multipart';
import { UnknownExtra, Item, IdParam, ParentIdParam, Member, Task, Actor } from 'graasp';

import graaspFileUploadLimiter from 'graasp-file-upload-limiter';


// const createError = require('fastify-error');
// const SomeError = createError('FST_GFIERR001', 'Unable to \'%s\' of %s');

export type AuthTokenSubject = { member: string, item: string, origin: string, app: string }

declare module 'fastify' {
  interface FastifyRequest {
      authTokenSubject: AuthTokenSubject;
      member: Member;
  }
}

import { download as downloadSchema, upload as uploadSchema } from './schema';
import GetFileFromItemTask from './tasks/get-file-from-item-task';

export interface FileItemExtra extends UnknownExtra {
  file: {
    name: string,
    path: string,
    mimetype: string
  }
}

export interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
  */
  storageRootPath: string;
  onFileUploaded: (
    parentId: string,
    data: Partial<Item<FileItemExtra>>,
    auth: {
      member: Member<UnknownExtra>,
      token: AuthTokenSubject
    },
  ) => Promise<Task<Actor, unknown>[]>;

  downloadValidation: (
    id: string,
    auth: {
      member: Member<UnknownExtra>,
      token: AuthTokenSubject
    },
  ) => Promise<Task<Actor, unknown>[]>;
}

export const ITEM_TYPE = 'file';
const ORIGINAL_FILENAME_TRUNCATE_LIMIT = 100;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024 * 250; // 250MB

const randomHexOf4 = () => (Math.random() * (1 << 16) | 0).toString(16).padStart(4, '0');


const plugin: FastifyPluginAsync<GraaspFileItemOptions> = async (fastify, options) => {
  const { items: { taskManager }, taskRunner: runner } = fastify;
  const { storageRootPath } = options;

  if (!storageRootPath) {
    throw new Error('graasp-file-item: missing plugin options');
  }

  // register post delete handler to erase the file of a 'file item'
  const deleteItemTaskName = taskManager.getDeleteTaskName();
  runner.setTaskPostHookHandler(deleteItemTaskName, (item: Partial<Item<FileItemExtra>>, _actor, { log }) => {
    const { type: itemType, extra: { file } = {} } = item;
    if (itemType !== ITEM_TYPE || !file) return;

    const { path: filepath } = file;
    const storageFilepath = `${storageRootPath}/${filepath}`;
    unlink(storageFilepath)
      // using request's logger instance. can't use arrow fn because 'log.error' uses 'this'.
      .catch(function (error) { log.error(error) });
  });

  // register pre copy handler to make a copy of the 'file item's file
  const copyItemTaskName = taskManager.getCopyTaskName();
  runner.setTaskPreHookHandler(copyItemTaskName, async (item: Partial<Item<FileItemExtra>>) => {
    const { type: itemType, extra: { file } = {} } = item;
    if (itemType !== ITEM_TYPE || !file) return;

    const { path: originalFilepath } = file;
    const path = `${randomHexOf4()}/${randomHexOf4()}`;

    // create directories path
    await mkdir(`${storageRootPath}/${path}`, { recursive: true });

    // copy file
    const filepath = `${path}/${randomHexOf4()}-${Date.now()}`;
    const storageFilepath = `${storageRootPath}/${filepath}`;

    const storageOriginalFilepath = `${storageRootPath}/${originalFilepath}`;
    await copyFile(storageOriginalFilepath, storageFilepath);

    // update item copy's 'extra'
    if (item.extra)
      item.extra.file.path = filepath;
  });


  fastify.register(fastifyMultipart, {
    limits: {
      // fieldNameSize: 0,             // Max field name size in bytes (Default: 100 bytes).
      // fieldSize: 1000000,           // Max field value size in bytes (Default: 1MB).
      fields: 0,                       // Max number of non-file fields (Default: Infinity).
      fileSize: DEFAULT_MAX_FILE_SIZE, // For multipart forms, the max file size (Default: Infinity).
      files: 5,                        // Max number of file fields (Default: Infinity).
      // headerPairs: 2000             // Max number of header key=>value pairs (Default: 2000 - same as node's http).
    }
  });

  fastify.register(graaspFileUploadLimiter, {
    sizePath: 'file.size',
    type: ITEM_TYPE
  });

  // receive uploaded file(s) and create item(s)
  fastify.post<{ Querystring: ParentIdParam }>('/upload', { schema: uploadSchema }, async (request, reply) => {
    const { query: { parentId }, authTokenSubject, member, log } = request;
    const parts = request.files();
    let count = 0;
    let item;

    for await (const { file, filename, mimetype, encoding } of parts) {
      count++;
      const path = `${randomHexOf4()}/${randomHexOf4()}`;

      // create directories path
      await mkdir(`${storageRootPath}/${path}`, { recursive: true });

      // 'pump' file to directory
      const filepath = `${path}/${randomHexOf4()}-${Date.now()}`;
      const storageFilepath = `${storageRootPath}/${filepath}`;
      await pipeline(file, fs.createWriteStream(storageFilepath));

      // get file size
      const { size } = await stat(storageFilepath);

      try {
        // create 'file' item
        const name = filename.substring(0, ORIGINAL_FILENAME_TRUNCATE_LIMIT);
        const data = {
          name,
          type: ITEM_TYPE,
          extra: { file: { name: filename, path: filepath, size, mimetype, encoding } }
        };
        
        item = await runner.runSingleSequence(await options.onFileUploaded(parentId, data, { member, token: authTokenSubject}), log);
      } catch (error) {
        await unlink(storageFilepath); // delete file if creation fails
        throw error;
      }
    }

    if (count === 1) {
      reply.status(StatusCodes.CREATED);
      return item;
    } else {
      reply.status(StatusCodes.NO_CONTENT);
    }
  });


  // download item's file
  fastify.get<{ Params: IdParam }>('/:id/download', { schema: downloadSchema }, async (request, reply) => {
    const { authTokenSubject, member, params: { id }, log } = request;

    const item = await runner.runSingleSequence(await options.downloadValidation(id, { member, token: authTokenSubject}), log) as Item<FileItemExtra>;

    const getFileTask = new GetFileFromItemTask(member || { id: authTokenSubject?.member }, { reply, path: storageRootPath, item });
    return runner.runSingleSequence([getFileTask], log);
  });
};

export default plugin;
