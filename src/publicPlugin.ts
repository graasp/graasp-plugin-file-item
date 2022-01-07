import { FastifyPluginAsync } from 'fastify';
import { getFileExtra, GraaspPluginFileItemOptions } from '.';
import { CannotEditPublicItem } from 'graasp-plugin-public';
import { FileItemExtra } from 'graasp-plugin-file';
import fileItemPlugin from './plugin';

const plugin: FastifyPluginAsync<GraaspPluginFileItemOptions> = async (
  fastify,
  options,
) => {
  const { serviceMethod, pathPrefix, shouldLimit, serviceOptions } = options;
  const {
    public: {
      items: { taskManager: pITM },
      graaspActor,
    },
  } = fastify;

  fastify.register(fileItemPlugin, {
    shouldLimit,
    pathPrefix,
    serviceMethod: serviceMethod,
    serviceOptions,
    uploadPreHookTasks: async (payload) => {
      throw new CannotEditPublicItem(payload);
    },
    downloadPreHookTasks: async ({ itemId: id }) => {
      const task = pITM.createGetPublicItemTask(graaspActor, { itemId: id });
      task.getResult = () => {
        const extra = getFileExtra(
          serviceMethod,
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
