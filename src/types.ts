import {
  LocalFileItemExtra,
  S3FileItemExtra,
  ServiceMethod,
  GraaspLocalFileItemOptions,
  GraaspS3FileItemOptions,
  DownloadPreHookTasksFunction,
  UploadPreHookTasksFunction,
} from "graasp-plugin-file";

declare module "fastify" {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspLocalFileItemOptions;
  }
}

export type FileItemExtra = S3FileItemExtra | LocalFileItemExtra;

export interface GraaspPluginFileItemOptions {
  serviceMethod: ServiceMethod;

  pathPrefix: string;

  serviceOptions: {
    s3: GraaspS3FileItemOptions;
    local: GraaspLocalFileItemOptions;
  };
  shouldLimit?: boolean;
  downloadPreHookTasks?: DownloadPreHookTasksFunction;
  uploadPreHookTasks?: UploadPreHookTasksFunction;
}
