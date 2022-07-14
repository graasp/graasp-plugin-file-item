import { FastifyPluginAsync } from 'fastify';

import { FileItemExtra } from '@graasp/sdk';
import { CannotEditPublicItem } from 'graasp-plugin-public';

import { GraaspPluginFileItemOptions, getFileExtra } from '.';
import fileItemPlugin from './plugin';

const plugin: FastifyPluginAsync<GraaspPluginFileItemOptions> = async (
  fastify,
  options,
) => {
  const { fileItemType, pathPrefix, shouldLimit, fileConfigurations } = options;
  const {
    public: {
      items: { taskManager: pITM },
      graaspActor,
    },
  } = fastify;

  fastify.register(fileItemPlugin, {
    shouldLimit,
    pathPrefix,
    fileItemType: fileItemType,
    fileConfigurations,
    uploadPreHookTasks: async (payload) => {
      throw new CannotEditPublicItem(payload);
    },
    downloadPreHookTasks: async ({ itemId: id }) => {
      const task = pITM.createGetPublicItemTask(graaspActor, { itemId: id });
      task.getResult = () => {
        const extra = getFileExtra(
          fileItemType,
          task.result.extra as FileItemExtra,
        );
        return {
          filepath: extra.path,
          mimetype: extra.mimetype,
        };
      };
      return [task];
    },
  });
};

export default plugin;
