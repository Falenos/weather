// devices-model.ts - A mongoose model
import { Model, Mongoose } from 'mongoose';
import { Application } from '../declarations';

export default function (app: Application): Model<any> {
  const modelName = 'Device';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      deviceId: { type: String, required: true },
      name: { type: String, required: true },
      location: {
        type: new Schema(
          {
            lat: Number,
            lon: Number,
          },
          { _id: false }
        ),
        required: true,
      },
      lastActiveAt: { type: Date, required: true },
    },
    {
      timestamps: true,
    }
  );

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<any>(modelName, schema);
}
