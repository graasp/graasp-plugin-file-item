/**
 * TODOs:
 * - generate the destination paths for the files
 * - generate the file names for the files: don't use original file names (just keep in db)
 * - improve logging
 * - ?parentId=<id> query param so that uploaded files/items are created below given parent item
 * - give item some meaningful name - maybe a "simplified" version of the file name
 * - 
 */

const pump = require('pump');
const fs = require('fs');
const fastifyMultipart = require('fastify-multipart');

async function pumpFileToDestination(file, path) {
  return new Promise((resolve, reject) => {
    pump(file, fs.createWriteStream(path), (err) => {
      if (err) return reject(new Error(err));
      resolve();
    });
  }).catch(err => err);
}

module.exports = async (fastify, options) => {
  const { storagePath } = options;
  const { taskManager, log } = fastify;

  /**
   * Create tasks for files that were properly saved ('pumped') in the file system,
   * otherwise log a warning.
   */
  const createTasks = async (member, savedFiles) => {
    const tasks = [];

    for (let i = 0; i < savedFiles.length; i++) {
      const { filename, encoding, mimetype, fileSavePromise } = savedFiles[i];
      try {
        const result = await fileSavePromise;
        if (result instanceof Error) throw result;

        const item = { name: 'new file', extra: { filename, encoding, mimetype } };
        const task = taskManager.createCreateTask(member, item);
        tasks.push(task);
      } catch (error) {
        log.warn(error, `File ${filename} from member ${member.id} not saved`);
      }
    }

    await taskManager.run(tasks);
  };

  fastify.register(fastifyMultipart, {});

  // upload file and create item with it
  fastify.post('/upload', async (request, reply) => {
    if (!request.isMultipart()) {
      reply.code(400);
      throw new Error('request is not multipart');
    }

    const { member } = request;
    const savedFiles = [];

    await new Promise((resolve, reject) => {
      request.multipart(
        (field, file, filename, encoding, mimetype) => {
          savedFiles.push({
            filename,
            encoding,
            mimetype,
            // start the 'pumping' while other files are being uploaded
            // (pumpFileToDestination() never 'rejects' otherwise it could not be called here like this)
            fileSavePromise: pumpFileToDestination(file, `${storagePath}/${filename}`)
          });
        },
        (err) => {
          if (err) return reject(err);

          createTasks(member, savedFiles);
          resolve();
        }
      );
    });

    reply.status(204);
  });

  // download item's file
  fastify.get('/download/:id', async (request, reply) => {
    const { member, params: { id } } = request;

    const task = taskManager.createGetTask(member, id);
    const { extra: { filename, mimetype } } = await taskManager.run([task]);

    if (!filename) {
      reply.status(400);
      throw new Error('Item with no file');
    }

    reply.type(mimetype);
    // this header will make the browser download the file with `filename` instead of
    // simply opening it and showing it
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    // TODO: can/should this be done in a worker (fastify piscina)?
    return fs.createReadStream(`${storagePath}/${filename}`);
  });
};
