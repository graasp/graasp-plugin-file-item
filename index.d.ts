import { FastifyPluginAsync } from 'fastify';
import { ItemCustomTaskManager } from 'graasp';

interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
  itemTaskManager: ItemCustomTaskManager
}

declare const plugin: FastifyPluginAsync<GraaspFileItemOptions>;
export default plugin;
