import { FastifyPluginAsync } from "fastify";
import { getFileExtra, GraaspPluginFileItemOptions } from ".";
import { CannotEditPublicItem } from "graasp-plugin-public";
import { FileItemExtra } from "graasp-plugin-file";
import fileItemPlugin from "./plugin";

const plugin: FastifyPluginAsync<GraaspPluginFileItemOptions> = async (
  fastify,
  options
) => {
  const { serviceMethod, pathPrefix, shouldLimit } = options;
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
    serviceOptions: {
      s3: fastify.s3FileItemPluginOptions,
      local: fastify.fileItemPluginOptions,
    },
    uploadPreHookTasks: async (id) => {
      throw new CannotEditPublicItem(id);
    },
    downloadPreHookTasks: async ({ itemId: id }) => {
      const task = pITM.createGetPublicItemTask(graaspActor, { itemId: id });
      task.getResult = () => {
        const extra = getFileExtra(
          serviceMethod,
          task.result.extra as FileItemExtra
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
