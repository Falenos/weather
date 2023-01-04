import { ObjectId } from 'bson';
import { MongooseServiceOptions, Service } from 'feathers-mongoose';
import { Application } from '../../declarations';

export class Devices extends Service {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars

  private app: Application;

  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async get(id: string): Promise<any[]> {
    console.log('param', id);
    return this.Model.aggregate()
      .match({ _id: new ObjectId(id) })
      .lookup({
        from: 'weathers',
        localField: '_id',
        foreignField: 'device',
        as: 'weather',
      });
  }
}
