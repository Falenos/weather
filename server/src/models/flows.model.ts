// flows-model.ts - A mongoose model
import { Model, Mongoose } from 'mongoose';
import { Application } from '../declarations';

export default function (app: Application): Model<any> {
  const modelName = 'Flow';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      name: { type: String, required: true },
      status: { type: String, required: true },
      errorMessage: Schema.Types.Mixed,
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
