import { Application } from '@feathersjs/feathers';

export interface StepDependencies {
  api: Application;
  flowId: string;
}

export type FlowMapParams = {
  _id: string;
  name: string;
  status: string;
};
