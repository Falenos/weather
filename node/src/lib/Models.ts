import { Application } from '@feathersjs/feathers';

export interface BaseDependsTypes {
  api: Application;
  flowId: string;
}

export interface StepDependencies extends BaseDependsTypes {
  // userId: string;
}

export type FlowMapParams = {
  _id: string;
  name: string;
  status: string;
};

export interface JobData {
  type: 'DeviceFetcher' | 'WeatherFetcher';
  deviceId?: string;
}
