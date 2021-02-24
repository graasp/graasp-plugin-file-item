import { FastifyPluginAsync } from 'fastify';

interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
}

declare const plugin: FastifyPluginAsync<GraaspFileItemOptions>;
export default plugin;
