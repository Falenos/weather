// Initializes the `devices` service on path `/devices`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import createModel from '../../models/devices.model';
import { Devices } from './devices.class';
import hooks from './devices.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    devices: Devices & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true,
  };

  const devices = new Devices(options, app);
  // devices.docs = {
  //   definitions: {
  //     devices: {
  //       type: 'object',
  //       required: ['deviceId', 'name', 'location', 'lastActiveAt'],
  //       properties: {
  //         text: {
  //           type: 'string',
  //           description: 'The message text',
  //         },
  //         userId: {
  //           type: 'string',
  //           description: 'The id of the user that sent the message',
  //         },
  //         deviceId: { type: 'string', description: 'The original device id' },
  //         name: { type: 'string', description: 'The device name' },
  //         location: { type: 'object', description: 'The device location' },
  //         lastActiveAt: { type: 'object', description: 'The last active timestamp' },
  //       },
  //     },
  //   },
  // };

  // Initialize our service with any options it requires
  app.use('/devices', devices);

  // Get our initialized service so that we can register hooks
  const service = app.service('devices');

  service.hooks(hooks);
}
