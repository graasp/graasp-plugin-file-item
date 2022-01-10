import { Item } from 'graasp';
import {
  Task as MockTask,
  TaskRunner as MockTaskRunner,
  ItemTaskManager as MockTaskManager,
  ItemMembershipTaskManager,
} from 'graasp-test';
import { FileTaskManager } from 'graasp-plugin-file';

export const mockCreateTaskSequence = (
  data: Partial<Item> | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mockCreateTask = jest
    .spyOn(MockTaskManager.prototype, 'createCreateTaskSequence')
    .mockImplementation(() => {
      return [new MockTask(data)];
    });
  jest
    .spyOn(MockTaskRunner.prototype, 'runSingleSequence')
    .mockImplementation(async () => {
      if (shouldThrow) throw data;
      return data;
    });
  return mockCreateTask;
};

export const mockGetTaskSequence = (
  data: Partial<Item> | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mockCreateTask = jest
    .spyOn(MockTaskManager.prototype, 'createGetTaskSequence')
    .mockImplementation(() => {
      return [new MockTask(data)];
    });
  jest
    .spyOn(MockTaskRunner.prototype, 'runSingleSequence')
    .mockImplementation(async () => {
      if (shouldThrow) throw data;
      return data;
    });
  return mockCreateTask;
};

export const mockGetOfItemTaskSequence = (
  data: boolean | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mock = jest
    .spyOn(ItemMembershipTaskManager.prototype, 'createGetOfItemTaskSequence')
    .mockImplementation(() => {
      return [new MockTask(data), new MockTask(data)];
    });
  jest
    .spyOn(MockTaskRunner.prototype, 'runSingleSequence')
    .mockImplementation(async () => {
      if (shouldThrow) throw data;
      return data;
    });
  return mock;
};

export const mockCreateDeleteFileTask = (
  data: boolean | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mock = jest
    .spyOn(FileTaskManager.prototype, 'createDeleteFileTask')
    .mockImplementation(() => {
      return new MockTask(data);
    });
  jest
    .spyOn(MockTaskRunner.prototype, 'runSingle')
    .mockImplementation(async () => {
      if (shouldThrow) throw data;
      return data;
    });
  return mock;
};

export const mockCreateCopyFileTask = (
  data: string | Error,
  shouldThrow?: boolean,
): jest.SpyInstance => {
  const mock = jest
    .spyOn(FileTaskManager.prototype, 'createCopyFileTask')
    .mockImplementation(() => {
      return new MockTask(data);
    });
  jest
    .spyOn(MockTaskRunner.prototype, 'runSingle')
    .mockImplementation(async () => {
      if (shouldThrow) throw data;
      return data;
    });
  return mock;
};
