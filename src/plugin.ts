import { FastifyPluginAsync } from 'fastify';

import {
  FileItemExtra,
  Item,
  ItemType,
  LocalFileItemExtra,
  PermissionLevel,
  S3FileItemExtra,
} from '@graasp/sdk';
import graaspFileUploadLimiter from 'graasp-file-upload-limiter';
import {
  FileUploadLimiterDbService,
  FileUploadLimiterTaskManager,
} from 'graasp-file-upload-limiter';
import basePlugin, { FileTaskManager } from 'graasp-plugin-file';

import { buildFilePathFromPrefix } from '.';
import { ORIGINAL_FILENAME_TRUNCATE_LIMIT } from './constants';
import { getFileExtra, getFilePathFromItemExtra } from './helpers';
import { GraaspPluginFileItemOptions } from './types';

const plugin: FastifyPluginAsync<GraaspPluginFileItemOptions> = async (
  fastify,
  options,
) => {
  const {
    shouldLimit = false,
    fileItemType,
    fileConfigurations,
    pathPrefix,
    downloadPreHookTasks,
    uploadPreHookTasks,
  } = options;
  const {
    items: { taskManager: itemTaskManager },
    itemMemberships: { taskManager: iMTM },
    taskRunner: runner,
  } = fastify;

  if (fileItemType === ItemType.S3_FILE) {
    if (pathPrefix.startsWith('/')) {
      throw new Error(
        'graasp-plugin-file-item: local storage service root path is malformed',
      );
    }

    if (
      !fileConfigurations?.s3?.s3Region ||
      !fileConfigurations?.s3?.s3Bucket ||
      !fileConfigurations?.s3?.s3AccessKeyId ||
      !fileConfigurations?.s3?.s3SecretAccessKey
    ) {
      throw new Error(
        'graasp-plugin-file-item: mandatory options for s3 service missing',
      );
    }
  }

  const SIZE_PATH = `${fileItemType}.size`;

  const fileTaskManager = new FileTaskManager(fileConfigurations, fileItemType);
  const fULDS = new FileUploadLimiterDbService(SIZE_PATH);
  const fULTM = new FileUploadLimiterTaskManager(fULDS);

  // we cannot use a hash based on the itemid because we don't have an item id
  // when we upload the file
  const buildFilePath = (_itemId: string, _filename: string) => {
    return buildFilePathFromPrefix(pathPrefix);
  };

  // limit the upload depending on the user remaining storage
  // set copy prehook
  if (shouldLimit) {
    fastify.register(graaspFileUploadLimiter, {
      sizePath: SIZE_PATH,
      type: fileItemType,
    });
  }

  fastify.register(basePlugin, {
    buildFilePath,
    fileItemType,

    uploadPreHookTasks: async (data, memberOptions) => {
      const { member } = memberOptions;

      // allow to override pre hook, necessary for public endpoints
      if (uploadPreHookTasks) {
        return uploadPreHookTasks?.(data, memberOptions);
      }

      const tasks = [];
      // check user remaining storage
      if (shouldLimit) {
        tasks.push(
          fULTM.createCheckMemberStorageTask(member, {
            memberId: member.id,
            itemType: fileItemType,
          }),
        );
      }

      if (!data.parentId) return tasks;

      // check member has permission to upload item in parent
      const getTasks = iMTM.createGetOfItemTaskSequence(member, data.parentId);
      getTasks[1].input = { validatePermission: PermissionLevel.Write };
      return [...tasks, ...getTasks];
    },

    uploadPostHookTasks: async (
      { filename, itemId: parentId, filepath, mimetype, size },
      { member },
    ) => {
      // get metadata from upload task
      const name = filename.substring(0, ORIGINAL_FILENAME_TRUNCATE_LIMIT);
      const data = {
        name,
        type: fileItemType,
        extra: {
          [fileItemType]: {
            name: filename,
            path: filepath,
            mimetype,
            size,
          },
        },
        settings: {
          // image files get automatically generated thumbnails
          hasThumbnail: mimetype.startsWith('image'),
        },
      };
      // create corresponding item
      const tasks = itemTaskManager.createCreateTaskSequence(
        member,
        data,
        parentId,
      );

      return tasks;
    },

    downloadPreHookTasks: async ({ itemId }, memberOptions) => {
      // allow to override pre hook, necessary for public endpoints
      if (downloadPreHookTasks) {
        return downloadPreHookTasks?.({ itemId }, memberOptions);
      }

      // check can read item
      const tasks = itemTaskManager.createGetTaskSequence(
        memberOptions.member,
        itemId,
      );
      const last = tasks[tasks.length - 1];
      // last task should return the filepath and mimetype
      // for the base plugin to get the corresponding file
      last.getResult = () => {
        const extra = (tasks[0].result as Item<FileItemExtra>).extra;
        return {
          filepath: getFilePathFromItemExtra(fileItemType, extra),
          mimetype: getFileExtra(fileItemType, extra).mimetype,
        };
      };
      return tasks;
    },

    fileConfigurations,
  });

  // register post delete handler to remove the file object after item delete
  const deleteTaskName = itemTaskManager.getDeleteTaskName();
  runner.setTaskPostHookHandler<Item>(
    deleteTaskName,
    async ({ id, type, extra }, _actor, { log }) => {
      try {
        // delete file only if type is the current file type
        if (!id || type !== fileItemType) return;
        const filepath = getFilePathFromItemExtra(
          fileItemType,
          extra as FileItemExtra,
        );

        const task = fileTaskManager.createDeleteFileTask({ id }, { filepath });
        await runner.runSingle(task);
      } catch (err) {
        // we catch the error, it ensures the item is deleted even if the file is not
        // this is especially useful for the files uploaded before the migration to the new plugin
        log.error(err);
      }
    },
  );

  // register post copy handler to copy the file object after item copy
  const copyItemTaskName = itemTaskManager.getCopyTaskName();
  runner.setTaskPreHookHandler<Item>(
    copyItemTaskName,
    async (item, actor, { log }, { original }) => {
      const { id, type, extra } = item; // full copy with new `id`

      // copy file only if type is the current file type
      if (!id || type !== fileItemType) return;

      log.debug('copy item file');

      // filenames are not used
      const originalPath = getFileExtra(
        fileItemType,
        original.extra as FileItemExtra,
      ).path;
      const newFilePath = buildFilePath(item.id, 'filename');

      const task = fileTaskManager.createCopyFileTask(actor, {
        newId: item.id,
        originalPath,
        newFilePath,
        mimetype: getFileExtra(fileItemType, extra as FileItemExtra).mimetype,
      });
      const filepath = (await runner.runSingle(task)) as string;

      // update item copy's 'extra'
      if (fileItemType === ItemType.S3_FILE) {
        (item.extra as S3FileItemExtra).s3File.path = filepath;
      } else {
        (item.extra as LocalFileItemExtra).file.path = filepath;
      }
    },
  );
};

export default plugin;
