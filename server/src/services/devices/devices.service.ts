// Initializes the `devices` service on path `/devices`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Devices } from './devices.class';
import createModel from '../../models/devices.model';
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
  };

  // Initialize our service with any options it requires
  app.use('/devices', new Devices(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('devices');

  service.hooks(hooks);
}
