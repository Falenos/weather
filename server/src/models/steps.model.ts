// steps-model.ts - A mongoose model
import { Model, Mongoose } from 'mongoose';
import { Application } from '../declarations';

export default function (app: Application): Model<any> {
  const modelName = 'Step';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      name: { type: String, required: true },
      status: { type: String, required: true },
      errorMessage: Schema.Types.Mixed,
      flow: { type: Schema.Types.ObjectId, ref: 'Flow', required: true },
      meta: Schema.Types.Mixed,
    },
    {
      timestamps: true,
    }
  );

  // Create indexes on all fields except "errorMessage" and "createdAt"
  schema.index({ '$**': 1 }, { wildcardProjection: { errorMessage: 0, createdAt: 0 } });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  const model: Model<any, Record<string, unknown>> = mongooseClient.model(modelName, schema);
  return model;
}
