
const upload = {
  querystring: {
    type: 'object',
    properties: {
      parentId: { $ref: 'http://graasp.org/#/definitions/uuid' }
    },
    additionalProperties: false
  }
};

const download = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
};

export{
  upload,
  download
}
