import build from './app';
import { createReadStream } from 'fs';
import { files, ROOT_PATH, FILE_PATHS } from './constants';
import FormData from 'form-data';

describe('Options', () => {

  it('No root path should throw', async () => {
    expect(async () => await build('')).rejects.toThrow(Error);
  });
});

describe('Downloading files', () => {

  it('Try to download txt file', async () => {
    const app = await build(ROOT_PATH);

    const res = await app.inject({
      method: 'GET',
      url: `/${files[0].id}/download`
    });

    expect(res.statusCode).toBe(200);
  });

  it('Try to download folder', async () => {
    const app = await build(ROOT_PATH);

    const response = await app.inject({
      method: 'GET',
      url: `${files[1].id}/download`
    });

    expect(response.statusCode).toBe(400);
  });

  it('Try download unexisting id', async () => {
    const app = await build(ROOT_PATH);

    const response = await app.inject({
      method: 'GET',
      url: '00000000-0000-0000-0000-000000000003/download'
    });

    expect(response.statusCode).toBe(500);
  });
});

describe('Uploading files', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Uploading single txt file', async () => {
    const app = await build();

    const form = new FormData()
    form.append('file', createReadStream(FILE_PATHS[0]))

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      payload: form,
      headers: form.getHeaders()
    });

    expect(response.statusCode).toBe(201);
  });

  it('Uploading single pdf file', async () => {
    const app = await build();

    const form = new FormData()
    form.append('file', createReadStream(FILE_PATHS[1]))

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      payload: form,
      headers: form.getHeaders()
    });

    expect(response.statusCode).toBe(201);
  });

  it('Upload multiple files', async () => {
    const app = await build();

    const form = new FormData()
    form.append('file', createReadStream(FILE_PATHS[0]))
    form.append('file', createReadStream(FILE_PATHS[1]))

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      payload: form,
      headers: form.getHeaders()
    });

    expect(response.statusCode).toBe(204);
  });
})