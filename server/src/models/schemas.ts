const schemas = {
  Device: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
      },
      deviceId: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      location: {
        type: 'object',
        properties: {
          lat: {
            type: 'number',
          },
          lon: {
            type: 'number',
          },
        },
      },
      lastActiveAt: {
        type: 'string',
        format: 'date-time',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
      __v: {
        type: 'integer',
      },
    },
  },
  devices: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Device' },
      },
    },
  },
  devices_list: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Device' },
      },
    },
  },
  devices_pagination: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Device' },
      },
      total: { type: 'integer' },
      limit: { type: 'integer' },
      skip: { type: 'integer' },
    },
  },
  Step: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      status: { type: 'string' },
      errorMessage: { type: 'object' },
      flow: { type: 'string' },
      meta: { type: 'object' },
    },
  },
  step: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Step' },
      },
    },
  },
  steps_list: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Step' },
      },
    },
  },
  steps_pagination: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Step' },
      },
      total: { type: 'integer' },
      limit: { type: 'integer' },
      skip: { type: 'integer' },
    },
  },
  Flow: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      status: { type: 'string' },
      errorMessage: { type: 'object' },
    },
  },
  flows: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Flow' },
      },
    },
  },
  flows_list: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Flow' },
      },
    },
  },
  flows_pagination: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Flow' },
      },
      total: { type: 'integer' },
      limit: { type: 'integer' },
      skip: { type: 'integer' },
    },
  },
  Weather: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      device: { type: 'string' },
      deviceId: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
      temperature: { type: 'number' },
      humidity: { type: 'number' },
      windSpeed: { type: 'number' },
      icon: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      __v: { type: 'integer' },
    },
  },
  weather: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Weather' },
      },
    },
  },
  weathers_list: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Weather' },
      },
    },
  },
  weathers_pagination: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Weather' },
      },
      total: { type: 'integer' },
      limit: { type: 'integer' },
      skip: { type: 'integer' },
    },
  },
};

export default schemas;
