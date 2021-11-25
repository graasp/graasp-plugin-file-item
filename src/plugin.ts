import { FastifyPluginAsync } from "fastify";
import { Item } from "graasp";
import graaspFileUploadLimiter from "graasp-file-upload-limiter";
import basePlugin, {
  FileTaskManager,
  ServiceMethod,
  LocalFileItemExtra,
  S3FileItemExtra,
} from "graasp-plugin-file";
import {
  FILE_ITEM_TYPES,
  ORIGINAL_FILENAME_TRUNCATE_LIMIT,
} from "./constants";
import { randomHexOf4 } from "./helpers";
import { GraaspPluginFileItemOptions, FileItemExtra } from "./types";

const plugin: FastifyPluginAsync<GraaspPluginFileItemOptions> = async (
  fastify,
  options
) => {
  const {
    shouldLimit = false,
    serviceMethod,
    serviceOptions,
    pathPrefix,
    downloadPreHookTasks,
    uploadPreHookTasks,
  } = options;
  const {
    items: { taskManager: itemTaskManager },
    itemMemberships: { taskManager: iMTM },
    taskRunner: runner,
  } = fastify;

  // CHECK PARAMS
  if (
    serviceMethod === ServiceMethod.LOCAL &&
    (!pathPrefix.endsWith("/") || !pathPrefix.startsWith("/"))
  ) {
    throw new Error(
      "graasp-plugin-file: local storage service root path is malformed"
    );
  }

  if (serviceMethod === ServiceMethod.S3) {
    if (!pathPrefix.endsWith("/")) {
      throw new Error(
        "graasp-plugin-file: s3 storage service root path is malformed"
      );
    }

    if (
      !serviceOptions?.s3?.s3Region ||
      !serviceOptions?.s3?.s3Bucket ||
      !serviceOptions?.s3?.s3AccessKeyId ||
      !serviceOptions?.s3?.s3SecretAccessKey
    ) {
      throw new Error(
        "graasp-plugin-file: mandatory options for s3 service missing"
      );
    }
  }

  // define current item type
  const SERVICE_ITEM_TYPE =
    serviceMethod === ServiceMethod.S3
      ? FILE_ITEM_TYPES.S3
      : FILE_ITEM_TYPES.LOCAL;

  const fileTaskManager = new FileTaskManager(serviceOptions, serviceMethod);

  // we cannot use a hash based on the itemid because we don't have an item id
  // when we upload the file
  const buildFilePath = (_itemId: string, _filename: string) => {
    const filepath = `${randomHexOf4()}/${randomHexOf4()}/${randomHexOf4()}-${Date.now()}`;
    return `${pathPrefix}${filepath}`;
  };

  const getFileExtra = (
    extra: FileItemExtra
  ): {
    name: string;
    path: string;
    size: string;
    mimetype: string;
  } => {
    switch (serviceMethod) {
      case ServiceMethod.S3:
        return (extra as S3FileItemExtra).s3File;
      case ServiceMethod.LOCAL:
      default:
        return (extra as LocalFileItemExtra).file;
    }
  };

  const getFilePathFromItemExtra = (extra: FileItemExtra) => {
    return getFileExtra(extra).path;
  };

  // limit the upload depending on the user remaining storage
  if (shouldLimit) {
    fastify.register(graaspFileUploadLimiter, {
      sizePath: `${SERVICE_ITEM_TYPE}.size`,
      type: SERVICE_ITEM_TYPE,
    });
  }

  fastify.register(basePlugin, {
    buildFilePath,
    serviceMethod,

    uploadPreHookTasks: async (parentId, memberOptions) => {
      // allow to override pre hook, necessary for public endpoints
      if (uploadPreHookTasks) {
        return uploadPreHookTasks?.(parentId, memberOptions);
      }

      if (!parentId) return [];

      const tasks = iMTM.createGetOfItemTaskSequence(
        memberOptions.member,
        parentId
      );
      tasks[1].input = { validatePermission: "write" };
      return tasks;
    },

    uploadPostHookTasks: async (
      { filename, itemId: parentId, filepath, size, mimetype },
      { member }
    ) => {
      // get metadata from upload task
      const name = filename.substring(0, ORIGINAL_FILENAME_TRUNCATE_LIMIT);
      const data = {
        name,
        type: SERVICE_ITEM_TYPE,
        extra: {
          [SERVICE_ITEM_TYPE]: {
            name: filename,
            path: filepath,
            size,
            mimetype,
          },
        },
      };
      // create corresponding item
      const tasks = itemTaskManager.createCreateTaskSequence(
        member,
        data,
        parentId
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
        itemId
      );
      const last = tasks[tasks.length - 1];
      // last task should return the filepath and mimetype
      // for the base plugin to get the corresponding file
      last.getResult = () => {
        const extra = (tasks[0].result as Item<FileItemExtra>).extra;
        return {
          filepath: getFilePathFromItemExtra(extra),
          mimetype: getFileExtra(extra).mimetype,
        };
      };
      return tasks;
    },

    serviceOptions,
  });

  // register post delete handler to remove the file object after item delete
  const deleteTaskName = itemTaskManager.getDeleteTaskName();
  runner.setTaskPostHookHandler<Item>(
    deleteTaskName,
    async ({ id, type, extra }, _actor) => {
      // delete file only if type is the current file type
      if (!id || type !== SERVICE_ITEM_TYPE) return;
      const filepath = getFilePathFromItemExtra(extra as FileItemExtra);

      const task = fileTaskManager.createDeleteFileTask({ id }, { filepath });
      await runner.runSingle(task);
    }
  );

  // register post copy handler to copy the file object after item copy
  const copyItemTaskName = itemTaskManager.getCopyTaskName();
  runner.setTaskPreHookHandler<Item>(
    copyItemTaskName,
    async (item, actor, { }, { original }) => {
      const { id, type, extra } = item; // full copy with new `id`

      // copy file only if type is the current file type
      if (!id || type !== SERVICE_ITEM_TYPE) return;

      // filenames are not used
      const originalPath = buildFilePath(original.id, "filename");
      const newFilePath = buildFilePath(item.id, "filename");

      const task = fileTaskManager.createCopyFileTask(actor, {
        newId: item.id,
        originalPath,
        newFilePath,
        mimetype: getFileExtra(extra as FileItemExtra).mimetype,
      });
      const filepath = (await runner.runSingle(task)) as string;

      // update item copy's 'extra'
      if (serviceMethod === ServiceMethod.S3) {
        (item.extra as S3FileItemExtra).s3File.path = filepath;
      } else {
        (item.extra as LocalFileItemExtra).file.path = filepath;
      }
    }
  );
};

export default plugin;
