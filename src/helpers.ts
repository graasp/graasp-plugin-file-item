import {
  ServiceMethod,
  LocalFileItemExtra,
  S3FileItemExtra,
} from "graasp-plugin-file";
import { FileItemExtra } from "./types";

export const randomHexOf4 = () =>
  ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, "0");


export const getFileExtra = (serviceMethod,
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

export const getFilePathFromItemExtra = (serviceMethod: ServiceMethod, extra: FileItemExtra) => {
  return getFileExtra(serviceMethod, extra).path;
};
