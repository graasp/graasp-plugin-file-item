import fastify, { FastifyPluginAsync } from 'fastify';
import { PublicItemTaskManager } from 'graasp-plugin-public';
import {
  ItemMembershipTaskManager,
  ItemTaskManager,
  TaskRunner,
} from 'graasp-test';
import { Server } from 'http';

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern:
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function build<E>({
  plugin,
  runner,
  itemTaskManager,
  itemMembershipTaskManager,
  publicItemTaskManager,
  options,
}: {
  plugin: FastifyPluginAsync<E, Server>;
  runner: TaskRunner;
  itemTaskManager: ItemTaskManager;
  itemMembershipTaskManager: ItemMembershipTaskManager;
  options?: E;
  publicItemTaskManager?: PublicItemTaskManager;
}) {
  const app = fastify();
  app.addSchema(schemas);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager: itemTaskManager,
  });
  app.decorate('itemMemberships', {
    taskManager: itemMembershipTaskManager,
  });
  app.decorate('public', {
    items: { taskManager: publicItemTaskManager },
  });
  await app.register(
    plugin,
    options ?? ({ pathPrefix: '/dist/' } as unknown as E),
  );

  return app;
}
export default build;
