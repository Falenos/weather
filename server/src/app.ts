import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import favicon from 'serve-favicon';

import configuration from '@feathersjs/configuration';
import express from '@feathersjs/express';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';

import { HookContext as FeathersHookContext } from '@feathersjs/feathers';
import swagger from 'feathers-swagger';
import appHooks from './app.hooks';
import channels from './channels';
import { Application } from './declarations';
import logger from './logger';
import middleware from './middleware';
import mongoose from './mongoose';
import services from './services';
// Don't remove this comment. It's needed to format import lines nicely.

const app: Application = express(feathers());
export type HookContext<T = any> = { app: Application } & FeathersHookContext<T>;

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.configure(mongoose);

// TODO: https://github.com/alt3/sequelize-to-json-schemas/issues/17
app.configure(
  swagger({
    docsPath: '/docs',
    ui: swagger.swaggerUI({}),
    idType: 'string',
    specs: {
      info: {
        title: 'Weather API',
        description: 'Weather API docs',
        version: '1.0.0',
      },
      schemes: ['http', 'https'], // Optionally set the protocol schema used (sometimes required when host on https)
      components: {
        schemas: {
          Device: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              location: { type: 'string' },
              status: { type: 'string' },
              lastSeen: { type: 'string', format: 'date-time' },
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
              device: { type: 'string' },
              deviceId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              temperature: { type: 'number' },
              humidity: { type: 'number' },
              windSpeed: { type: 'number' },
              icon: { type: 'string' },
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
        },
      },
    },
  })
);

// Configure other middleware (see `middleware/index.ts`)
app.configure(middleware);
// Set up our services (see `services/index.ts`)
app.configure(services);
// Set up event channels (see channels.ts)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger } as any));

app.hooks(appHooks);

export default app;
