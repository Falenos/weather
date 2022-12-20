import { Application } from '@feathersjs/feathers';
import { BaseDependsTypes } from '@models';
import bunyan from 'bunyan';
export abstract class Step<DependsTypes extends BaseDependsTypes, ReturnsType> {
  public abstract name: string;
  public logName?: string;
  protected flowId!: string;
  protected skip = false;
  protected id!: string;
  protected api!: Application;
  protected dependencies!: DependsTypes;
  public status: 'pending' | 'complete' | 'error' | 'running' | 'skipped';
  public errorMessage!: string;
  protected get meta(): any {
    return undefined;
  }
  protected log!: bunyan;

  protected baseBeforeHooks: {
    (...args: Parameters<Step<DependsTypes, ReturnsType>['exec']>): any;
  }[] = [];
  protected abstract beforeHooks: {
    (...args: Parameters<Step<DependsTypes, ReturnsType>['exec']>): any;
  }[];

  protected baseAfterHooks: {
    (data: ReturnsType): ReturnsType | Promise<ReturnsType>;
  }[] = [];
  protected abstract afterHooks: {
    (data: ReturnsType): ReturnsType | Promise<ReturnsType>;
  }[];

  protected genericErrorHook = (err: any): void =>
    console.error('[GenericErrorHookForStep]', {
      context: {
        type: 'STEP',
        name: this.name,
        id: this.id,
        flow: this.flowId,
        error: err,
      },
    });

  protected errorHooks: {
    (err: any): void | Promise<void>;
  }[] = [this.genericErrorHook];

  constructor() {
    this.status = 'pending';
  }

  private async updateDBRecord() {
    if (this.id) {
      await this.api.service('steps').patch(
        { _id: this.id },
        {
          name: this.name,
          status: this.status,
          errorMessage: this.errorMessage,
          flow: this.flowId,
          meta: this.meta,
        }
      );
    } else {
      this.id = (
        await this.api.service('steps').create({
          name: this.name,
          status: this.status,
          errorMessage: this.errorMessage,
          flow: this.flowId,
          meta: this.meta,
        })
      )._id;
    }
  }

  protected abstract exec(args: DependsTypes): Promise<any>;

  async run(...args: Parameters<Step<DependsTypes, ReturnsType>['exec']>): Promise<ReturnsType> {
    const { api, flowId } = args[0];
    this.api = api;
    this.flowId = flowId;
    this.status = 'running';
    this.dependencies = args[0];
    this.log =
      this.log ||
      bunyan.createLogger({
        name: this.logName || this.name,
      });
    let result;
    try {
      const beforeHooks = [...this.baseBeforeHooks, ...this.beforeHooks];
      for (const hook of beforeHooks) {
        await hook(...args);
      }
      await this.updateDBRecord();
      if (!this.skip) {
        result = await this.exec(...args);
        const afterHooks = [...this.baseAfterHooks, ...this.afterHooks];
        for (const hook of afterHooks) {
          result = await hook(result);
        }
        this.status = 'complete';
      } else {
        this.status = 'skipped';
      }
    } catch (error) {
      this.status = 'error';
      this.errorMessage = error as string; // TODO check this
      for (const hook of this.errorHooks) {
        await hook(error);
      }
      throw error;
    } finally {
      await this.updateDBRecord();
    }
    return result;
  }
}
