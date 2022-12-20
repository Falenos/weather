import { Application } from '@feathersjs/feathers';

export interface BaseDependsTypes {
  api: Application;
  flowId: string;
}

export interface StepDependencies extends BaseDependsTypes {
  // userId: string;
}
