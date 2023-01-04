// weather-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Model, Mongoose } from 'mongoose';
import { Application } from '../declarations';

export default function (app: Application): Model<any> {
  const modelName = 'Weather';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      device: {
        type: Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
      },
      deviceId: { type: String, required: true },
      timestamp: { type: Date, required: true },
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      icon: String,
    },
    {
      timestamps: true,
    }
  );

  schema.index({ deviceId: 1 });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<any>(modelName, schema);
}
