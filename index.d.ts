import fastify, { FastifyPlugin } from 'fastify';

declare namespace graasp3FileItem {
  interface Graasp3FileItemOptions {
    /**
     * Filesystem path to where the uploaded files will be saved
     */
    storagePath: string;
  }
}

declare const graasp3FileItem: FastifyPlugin<graasp3FileItem.Graasp3FileItemOptions>;

export default graasp3FileItem;
