import { FastifyLoggerInstance } from 'fastify';
import { Item, Member, MemberType } from 'graasp';
import { ServiceMethod } from 'graasp-plugin-file';
import { v4 } from 'uuid';
import { GraaspPluginFileItemOptions } from '../src';

export const ROOT_PATH = './test/files';
export const FILE_PATHS = ['./test/files/1.txt', './test/files/2.pdf'];

export const files: Partial<Item>[] = [
  {
    id: v4(),
    type: 'file',
    extra: {
      file: {
        name: '1.txt',
        path: '1.txt',
        size: 1594447,
        mimetype: 'text/plain',
      },
    },
  },
  {
    id: v4(),
    type: 'file',
    extra: {
      file: {
        name: '1.txt',
        path: '1.txt',
        size: 1594447,
        mimetype: 'text/plain',
      },
    },
  },
  {
    id: v4(),
    type: 'folder',
    extra: {},
  },
  {
    id: v4(),
    type: 's3File',
    extra: {
      s3File: {
        name: '1.txt',
        path: '1.txt',
        size: 1594447,
        mimetype: 'text/plain',
      },
    },
  },
];

export const ITEM_FILE_TXT = files[0];
export const ITEM_FILE_PDF = files[1];
export const ITEM_FOLDER = files[2];
export const S3_ITEM_FILE_TXT = files[3];
export const MEMBER: Member = {
  id: v4(),
  name: 'member',
  email: 'member@email.com',
  type: 'individual' as MemberType,
  extra: {},
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

const DEFAULT_S3_OPTIONS = {
  s3Region: 's3Region',
  s3Bucket: 's3Bucket',
  s3AccessKeyId: 's3AccessKeyId',
  s3SecretAccessKey: 's3SecretAccessKey',
};

const DEFAULT_LOCAL_OPTIONS = {
  storageRootPath: '/storageRootPath',
};

export const buildPublicLocalOptions = (
  pathPrefix = 'prefix/',
): Partial<GraaspPluginFileItemOptions> => ({
  serviceMethod: ServiceMethod.LOCAL,
  pathPrefix,
  serviceOptions: {
    local: DEFAULT_LOCAL_OPTIONS,
    s3: DEFAULT_S3_OPTIONS,
  },
});
export const buildPublicS3Options = (
  pathPrefix = 'prefix/',
  s3 = DEFAULT_S3_OPTIONS,
): Partial<GraaspPluginFileItemOptions> => ({
  serviceMethod: ServiceMethod.S3,
  pathPrefix,
  serviceOptions: {
    s3,
    local: DEFAULT_LOCAL_OPTIONS,
  },
});

export const buildLocalOptions = (
  pathPrefix = 'prefix/',
): Partial<GraaspPluginFileItemOptions> => ({
  serviceMethod: ServiceMethod.LOCAL,
  pathPrefix,
  serviceOptions: {
    local: DEFAULT_LOCAL_OPTIONS,
    s3: DEFAULT_S3_OPTIONS,
  },
});
export const buildS3Options = (
  pathPrefix = 'prefix/',
  s3 = DEFAULT_S3_OPTIONS,
): Partial<GraaspPluginFileItemOptions> => ({
  serviceMethod: ServiceMethod.S3,
  pathPrefix,
  serviceOptions: {
    s3,
    local: DEFAULT_LOCAL_OPTIONS,
  },
});
export const DEFAULT_LOGGER: FastifyLoggerInstance = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  debug: jest.fn(),
  child: jest.fn(),
};

export const FILE_SERVICES = [ServiceMethod.LOCAL, ServiceMethod.S3];

export const DEFAULT_ACTOR = {
  id: v4(),
};
