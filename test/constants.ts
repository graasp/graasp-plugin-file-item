import { Item } from 'graasp'

export const ROOT_PATH = './test/files';
export const FILE_PATHS = ['./test/files/1.txt', './test/files/2.pdf']

export const files: Partial<Item>[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    type: "file",
    extra:
    {
        file: 
        {
        name: "1.txt",
        path: "1.txt",
        size: 1594447,
        encoding: "7bit",
        mimetype: "text/plain"
        } 
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    type: "file",
    extra:
    {
        file: 
        {
        name: "1.txt",
        path: "1.txt",
        size: 1594447,
        encoding: "7bit",
        mimetype: "text/plain"
        } 
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    type: "folder",
    extra: { }
  }
];


export const ITEM_FILE_TXT = files[0];
export const ITEM_FILE_PDF = files[1];
export const ITEM_FOLDER = files[2];
