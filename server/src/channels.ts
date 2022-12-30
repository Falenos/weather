import '@feathersjs/transport-commons';
import { Application } from './declarations';

export default function (app: Application): void {
  if (typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', (connection: any): void => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection);
  });

  app.service('flows').publish((data: any) => [app.channel('anonymous')]);
}
