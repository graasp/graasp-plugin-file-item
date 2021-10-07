import { Item } from "graasp";
import { Task as MockTask, TaskRunner as MockTaskRunner, ItemTaskManager as MockTaskManager} from 'graasp-test';

 export const mockCreateTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
     const mockCreateTask = jest.spyOn(MockTaskManager.prototype, 'createCreateTaskSequence').mockImplementation(() => {
         return [new MockTask(data)];
     });
     jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
         if (shouldThrow)
             throw data;
         return data;
     });
     return mockCreateTask;
 };


 export const mockGetTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
     const mockCreateTask = jest.spyOn(MockTaskManager.prototype, 'createGetTaskSequence').mockImplementation(() => {
         return [new MockTask(data)];
     });
     jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
         if (shouldThrow)
             throw data;
         return data;
     });
     return mockCreateTask;
 };