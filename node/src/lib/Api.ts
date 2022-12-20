import feathers, { Application } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

let api: Promise<Application>;
export default async (): Promise<Application> => {
  // This Api is a singleton.
  // No matter how many times this file is imported
  // only one api connection will be created
  if (api) return api;
  api = (async (): Promise<Application> => {
    const socket = io(`${process.env.SERVER_URL}`, {
      transports: ['websocket'],
      upgrade: false,
    });
    const client = feathers();
    client.configure(
      socketio(socket, {
        timeout: 3 * 60 * 1000, // 3 minutes
      })
    );
    console.log('Api connected');
    return client;
  })();
  return api;
};
