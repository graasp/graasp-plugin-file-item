import { FastifyPluginAsync } from 'fastify';
import { ItemTaskManager } from 'graasp';

interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
  taskManager: ItemTaskManager;
}

declare const plugin: FastifyPluginAsync<GraaspFileItemOptions>;
export default plugin;
