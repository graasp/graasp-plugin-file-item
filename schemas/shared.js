module.exports = {
  upload: {
    querystring: {
      type: 'object',
      properties: {
        parentId: { $ref: 'http://graasp.org/#/definitions/uuid' }
      },
      additionalProperties: false
    }
  },
  download: {
    params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  }
}
