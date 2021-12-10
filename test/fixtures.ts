import { Item, Member, MemberType } from "graasp";
import { v4 } from "uuid";

export const ROOT_PATH = "./test/files";
export const FILE_PATHS = ["./test/files/1.txt", "./test/files/2.pdf"];

export const files: Partial<Item>[] = [
  {
    id: v4(),
    type: "file",
    extra: {
      file: {
        name: "1.txt",
        path: "1.txt",
        size: 1594447,
        mimetype: "text/plain",
      },
    },
  },
  {
    id: v4(),
    type: "file",
    extra: {
      file: {
        name: "1.txt",
        path: "1.txt",
        size: 1594447,
        mimetype: "text/plain",
      },
    },
  },
  {
    id: v4(),
    type: "folder",
    extra: {},
  },
  {
    id: v4(),
    type: "s3File",
    extra: {
      s3File: {
        name: "1.txt",
        path: "1.txt",
        size: 1594447,
        mimetype: "text/plain",
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
  name: "member",
  email: "member@email.com",
  type: "individual" as MemberType,
  extra: {},
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};
