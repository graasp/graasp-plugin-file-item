import path from 'path';

import {
  FileItemExtra,
  ItemType,
  LocalFileItemExtra,
  S3FileItemExtra,
} from '@graasp/sdk';

export const randomHexOf4 = (): string =>
  ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, '0');

export const getFileExtra = (
  serviceMethod: ItemType,
  extra: FileItemExtra,
): {
  name: string;
  path: string;
  mimetype: string;
} => {
  switch (serviceMethod) {
    case ItemType.S3_FILE:
      return (extra as S3FileItemExtra).s3File;
    case ItemType.LOCAL_FILE:
    default:
      return (extra as LocalFileItemExtra).file;
  }
};

export const getFilePathFromItemExtra = (
  serviceMethod: ItemType,
  extra: FileItemExtra,
): string => {
  return getFileExtra(serviceMethod, extra).path;
};

export const buildFilePathFromPrefix = (pathPrefix: string): string => {
  const filepath = `${randomHexOf4()}/${randomHexOf4()}/${randomHexOf4()}-${Date.now()}`;
  return path.join(pathPrefix, filepath);
};
