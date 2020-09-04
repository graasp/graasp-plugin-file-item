module.exports = {
  common: {
    $id: 'http://graasp.org/file-item/',
    definitions: {
      uuid: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$'
      },
      idParam: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { $ref: '#/definitions/uuid' }
        },
        additionalProperties: false
      }
    }
  },
  upload: {
    querystring: {
      type: 'object',
      properties: {
        parentId: { $ref: 'http://graasp.org/file-item/#/definitions/uuid' }
      },
      additionalProperties: false
    }
  },
  download: {
    params: { $ref: 'http://graasp.org/file-item/#/definitions/idParam' },
  }
}