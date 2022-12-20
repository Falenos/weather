import { Application } from '@feathersjs/feathers';
import bunyan from 'bunyan';
import { Step } from './Step';

export abstract class Flow {
  public abstract name: string;
  protected api!: Application;
  public userId!: string;

  public id!: string;
  public status: 'pending' | 'complete' | 'error' | 'running';
  public errorMessage!: string;
  protected abstract steps: { [key: string]: Step<any, any> | (() => Step<any, any>) };
  protected log!: bunyan;

  protected genericErrorHook = (err: any) =>
    console.error('[GenericErrorHookForFlow]', {
      context: {
        type: 'FLOW',
        name: this.name,
        id: this.id,
        error: err,
      },
    });

  protected errorHooks: {
    (err: any): void | Promise<void>;
  }[] = [this.genericErrorHook];

  public abstract clone(): Flow;
  public abstract shouldRepeat(): boolean | Promise<boolean>;

  constructor() {
    this.status = 'pending';
  }

  private async updateDBRecord() {
    if (this.id) {
      await this.api.service('flows').patch(
        { _id: this.id },
        {
          name: this.name,
          status: this.status,
          errorMessage: this.errorMessage,
          user: this.userId,
        }
      );
    } else {
      this.id = (
        await this.api.service('flows').create({
          name: this.name,
          status: this.status,
          errorMessage: this.errorMessage,
          user: this.userId,
        })
      )._id;
    }
  }

  protected abstract exec(): Promise<void>;

  async run(): Promise<void> {
    this.status = 'running';
    this.log = bunyan.createLogger({
      name: this.name,
      user: this.userId,
    });
    try {
      await this.updateDBRecord();
      await this.exec();
      this.status = 'complete';
    } catch (error) {
      this.status = 'error';
      this.errorMessage = error as string; // TODO check this out
      for (const hook of this.errorHooks) {
        await hook(error);
      }
    } finally {
      await this.updateDBRecord();
    }
  }
}
