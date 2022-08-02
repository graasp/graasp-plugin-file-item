import {
  FileItemType,
  LocalFileConfiguration,
  S3FileConfiguration,
} from '@graasp/sdk';
import {
  DownloadPreHookTasksFunction,
  UploadPreHookTasksFunction,
} from 'graasp-plugin-file';

export interface GraaspPluginFileItemOptions {
  fileItemType: FileItemType;

  pathPrefix: string;

  fileConfigurations: {
    s3: S3FileConfiguration;
    local: LocalFileConfiguration;
  };

  // upload limiter
  shouldLimit?: boolean;

  downloadPreHookTasks?: DownloadPreHookTasksFunction;
  uploadPreHookTasks?: UploadPreHookTasksFunction;
}
