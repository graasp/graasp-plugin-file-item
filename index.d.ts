import { FastifyPluginAsync } from 'fastify';
import { TaskManager, Member, Item } from 'graasp';

interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
  itemTaskManager: TaskManager<Member, Item>;
  deleteItemTaskName: string;
  copyItemTaskName: string;
}

declare const plugin: FastifyPluginAsync<GraaspFileItemOptions>;
export default plugin;
