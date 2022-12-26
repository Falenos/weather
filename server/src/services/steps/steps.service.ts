// Initializes the `steps` service on path `/steps`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import createModel from '../../models/steps.model';
import { Steps } from './steps.class';
import hooks from './steps.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    steps: Steps & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
  };

  // Initialize our service with any options it requires
  app.use('/steps', new Steps(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('steps');

  service.hooks(hooks);
}
