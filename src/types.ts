import {
  LocalFileItemExtra,
  S3FileItemExtra,
  ServiceMethod,
  GraaspLocalFileItemOptions,
  GraaspS3FileItemOptions,
  DownloadPreHookTasksFunction
} from "graasp-plugin-file";

export type FileItemExtra = S3FileItemExtra | LocalFileItemExtra;

export interface GraaspPluginFileItemOptions {
  serviceMethod: ServiceMethod;

  pathPrefix: string;

  serviceOptions: {
    s3: GraaspS3FileItemOptions;
    local: GraaspLocalFileItemOptions;
  };
  shouldLimit?: boolean;
  downloadPreHookTasks?: DownloadPreHookTasksFunction
}
