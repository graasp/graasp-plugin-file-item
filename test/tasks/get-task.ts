import { FastifyLoggerInstance } from 'fastify'
import { Actor, Task, PostHookHandlerType, PreHookHandlerType, TaskStatus } from 'graasp'
import { DatabaseTransactionConnectionType } from 'slonik';
import { files } from '../constants'

export default class GetTask implements Task<Actor, unknown>{
    name: string;
    actor: Actor;
    targetId?: string;
    data?: Partial<unknown>;
    status: TaskStatus;
    result: unknown;
    message?: string;
    partialSubtasks?: boolean;
  
    constructor(objectId: string){
      this.targetId = objectId;
    }
  
    run(handler: DatabaseTransactionConnectionType, log: FastifyLoggerInstance): Promise<void | Task<Actor, unknown>[]> {
      this.getResult = () => files.find(x => x.id == this.targetId);
  
      return Promise.resolve();
    }
  
    preHookHandler?: PreHookHandlerType<unknown, unknown>;
    postHookHandler?: PostHookHandlerType<unknown, unknown>;
    skip?: boolean;
    input?: unknown;
    getInput?: () => unknown;
    getResult?: () => unknown;
  }