import { Application } from '@feathersjs/feathers';
import { delay } from '@flows/helpers';
import { StepDependencies } from '@models';
import bunyan from 'bunyan';
import { differenceInSeconds, subMinutes } from 'date-fns';
import { get, map } from 'lodash';
import { Flow } from '../../lib/Flow';
import { Devices } from './steps/Devices';
const log = bunyan.createLogger({ name: 'DEVICE_FETCHER' });

export class DeviceFetcher extends Flow {
  name = 'DeviceFetcher';
  public type = DeviceFetcher;

  readonly steps = {
    devices: (): Devices => new Devices(),
  };

  static async bootstrap({ api }: { api: Application }, cb: (arg0: DeviceFetcher) => void): Promise<void> {
    cb(new DeviceFetcher({ api }));
    log.info(`Added devices in loop`);
  }

  constructor({ api }: { api: Application }) {
    super();
    this.api = api;
  }

  errorHooks = [this.genericErrorHook];

  clone(): DeviceFetcher {
    return new DeviceFetcher({
      api: this.api,
    });
  }

  async shouldRepeat(): Promise<boolean> {
    return true;
  }

  protected async exec(): Promise<void> {
    this.log.info(`Starting...`);

    const repeatDelay = await this.repeatDelay({
      api: this.api,
    });
    await delay(repeatDelay);

    const stepCommonDependencies: StepDependencies = {
      api: this.api,
      flowId: this.id,
    };

    await this.steps.devices().run(stepCommonDependencies);

    // We clean at the end so that we won't delay other flows
    await this.cleanUp();

    log.info('Finished.');
    return;
  }

  protected async repeatDelay({ api }: { api: Application }): Promise<number> {
    const res = await api.service('flows').find({
      query: {
        name: this.name,
        status: 'complete',
        $limit: 2,
        $sort: {
          updatedAt: -1,
        },
      },
    });
    const lastFlow = get(res, 'data[1]', null);
    // The fallback second diff is 21, for the cases that we don't have a previous flow
    const diffInSec = lastFlow ? differenceInSeconds(new Date(), new Date(lastFlow.updatedAt)) : 21;
    lastFlow && log.info(`Difference from last ${this.name} flow is ${diffInSec} seconds`);
    // If more than 10 seconds have past, we run the flow
    if (diffInSec > 20) return 0;
    // If not, we calc the diff and run it when the time diff reaches 10 seconds
    const diffInMs = (20 - (diffInSec || 1)) * 1000;
    return diffInMs;
  }

  private async cleanUp(): Promise<void> {
    this.log.info('Cleaning up...');

    const findFlows = async (): Promise<string[]> => {
      const { data } = await this.api.service('flows').find({
        query: {
          name: this.name,
          status: 'complete',
          $sort: {
            updatedAt: -1,
          },
          createdAt: { $lt: subMinutes(new Date(), 3).toISOString() },
          $limit: 500,
          $select: ['_id'],
        },
      });
      return map(data, '_id');
    };

    // All flowIds except of the last 3 minutes
    const flowIDs = await findFlows();

    const deleteStepsOfFlow = async (id: string) => {
      const deletedSteps = await this.api.service('steps').remove(null, { query: { flow: id } });
      deletedSteps.length > 0 && this.log.info(`${deletedSteps.length} steps were removed from flow ${id}`);
    };

    // Remove steps
    // We have a for loop to avoid feathers timeout issues
    for (const id of flowIDs) {
      await deleteStepsOfFlow(id);
    }

    // Remove flows
    const deletedFlows: any[] = await this.api.service('flows').remove(null, { query: { _id: { $in: flowIDs } } });
    deletedFlows.length > 0 && this.log.info(`Removed ${deletedFlows.length} flows`);

    this.log.info('Finished cleaning');
  }
}
