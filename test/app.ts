import fastify from 'fastify'
import { ItemTaskManager, TaskRunner } from 'graasp-test';
import plugin from '../src/plugin'

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    }
  }
};

const build = async ({ runner, taskManager, options } : { runner: TaskRunner, taskManager: ItemTaskManager, options?: any }) => {

  const app = fastify();
  app.addSchema(schemas)

  app.decorate('taskRunner', runner); 
  app.decorate('items', {
    taskManager: taskManager,
  });
  await app.register(plugin, options ?? { storageRootPath: 'dist'});

  return app;
};
export default build;
