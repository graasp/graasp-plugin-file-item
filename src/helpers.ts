import path from "path";
import {
  ServiceMethod,
  LocalFileItemExtra,
  S3FileItemExtra,
} from "graasp-plugin-file";
import { FileItemExtra } from "./types";

export const randomHexOf4 = (): string =>
  ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, "0");

export const getFileExtra = (
  serviceMethod: ServiceMethod,
  extra: FileItemExtra
): {
  name: string;
  path: string;
  size: string;
  mimetype: string;
} => {
  switch (serviceMethod) {
    case ServiceMethod.S3:
      return (extra as S3FileItemExtra).s3File;
    case ServiceMethod.LOCAL:
    default:
      return (extra as LocalFileItemExtra).file;
  }
};

export const getFilePathFromItemExtra = (
  serviceMethod: ServiceMethod,
  extra: FileItemExtra
): string => {
  return getFileExtra(serviceMethod, extra).path;
};

export const buildFilePathFromPrefix = (pathPrefix: string): string => {
  const filepath = `${randomHexOf4()}/${randomHexOf4()}/${randomHexOf4()}-${Date.now()}`;
  return path.join(pathPrefix, filepath);
};
