import {
  DownloadPreHookTasksFunction,
  GraaspLocalFileItemOptions,
  GraaspS3FileItemOptions,
  LocalFileItemExtra,
  S3FileItemExtra,
  ServiceMethod,
  UploadPreHookTasksFunction,
} from 'graasp-plugin-file';

export type FileItemExtra = S3FileItemExtra | LocalFileItemExtra;

export interface GraaspPluginFileItemOptions {
  serviceMethod: ServiceMethod;

  pathPrefix: string;

  serviceOptions: {
    s3: GraaspS3FileItemOptions;
    local: GraaspLocalFileItemOptions;
  };

  // upload limiter
  shouldLimit?: boolean;

  downloadPreHookTasks?: DownloadPreHookTasksFunction;
  uploadPreHookTasks?: UploadPreHookTasksFunction;
}
