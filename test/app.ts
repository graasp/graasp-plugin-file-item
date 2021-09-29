import fastify from 'fastify'
import plugin from '../src/plugin'
import TaskManager from './mocks/task-manager';
import Runner from './mocks/task-runner';

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

const build = async (storageRootPath='dist') => {

  const app = fastify();
  app.addSchema(schemas)

  app.decorate('taskRunner', new Runner()); 
  app.decorate('items', {
    taskManager: new TaskManager(),
  });

  await app.register(plugin, {
    storageRootPath: storageRootPath
  });

  return app;
};
export default build;