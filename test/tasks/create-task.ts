import fastify, { FastifyLoggerInstance } from 'fastify'
import { Actor, Item, ItemTaskManager, Task, UnknownExtra, TaskRunner, PostHookHandlerType, PreHookHandlerType, TaskStatus } from 'graasp'
import { DatabaseTransactionConnectionType } from 'slonik';

export default class CreateTask implements Task<Actor, unknown>{
    name: string;
    actor: Actor;
    targetId?: string;
    data?: Partial<unknown>;
    status: TaskStatus;
    result: unknown;
    message?: string;
    partialSubtasks?: boolean;
  
    constructor(data){
      this.data = data;
    }
  
    run(handler: DatabaseTransactionConnectionType, log: FastifyLoggerInstance): Promise<void | Task<Actor, unknown>[]> {
      this.getResult = () => this.data;
      return Promise.resolve()  
    }
    preHookHandler?: PreHookHandlerType<unknown, unknown>;
    postHookHandler?: PostHookHandlerType<unknown, unknown>;
    skip?: boolean;
    input?: unknown;
    getInput?: () => unknown;
    getResult?: () => unknown;
  }