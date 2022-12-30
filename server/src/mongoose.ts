import mongoose from 'mongoose';
import { Application } from './declarations';
import logger from './logger';

export default function (app: Application): void {
  mongoose
    .connect(app.get('mongodb_url'), {
      dbName: app.get('mongodb_dbName'),
    })
    .catch((err) => {
      // console.log('ERROR::', app.get('mongodb_url'), app.get('mongodb_dbName'));
      logger.error(err);
      process.exit(1);
    });

  app.set('mongooseClient', mongoose);
}
