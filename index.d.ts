import fastify, { FastifyPlugin } from 'fastify';

declare namespace graasp3FileItem {
  interface Graasp3FileItemOptions {
    /**
     * Filesystem root path where the uploaded files will be saved
     */
    storageRootPath: string;
  }
}

declare const graasp3FileItem: FastifyPlugin<graasp3FileItem.Graasp3FileItemOptions>;

export default graasp3FileItem;
