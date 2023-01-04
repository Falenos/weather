import { MongooseServiceOptions, Service } from 'feathers-mongoose';
import { Application } from '../../declarations';

export class Devices extends Service {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars

  private app: Application;

  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  // async get(): Promise<any[]> {
  //   console.log('GET');
  //   return [];
  // }

  // async find(): Promise<any[]> {
  //   console.log('FIND');
  //   return [];
  // }
}
