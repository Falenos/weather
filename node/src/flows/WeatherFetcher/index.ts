import { Application } from '@feathersjs/feathers';
import { delay } from '@flows/helpers';
import { FlowMapParams, StepDependencies } from '@models';
import bunyan from 'bunyan';
import { differenceInSeconds, subMinutes } from 'date-fns';
import { get, map } from 'lodash';
import { Flow } from '../../lib/Flow';
import { Weather } from './steps/Weather';
const log = bunyan.createLogger({ name: 'WEATHER_FETCHER' });

export class WeatherFetcher extends Flow {
  name: string;
  deviceId: string;
  type = WeatherFetcher;

  readonly steps = {
    weather: (): Weather => new Weather(),
  };

  static async getDeviceFetcherRuns({ api }: { api: Application }): Promise<number> {
    const { total } = await api.service('flows').find({
      query: {
        name: 'DeviceFetcher',
        status: 'complete',
        $limit: 0,
      },
    });
    return total;
  }

  static async devicesAlreadyRun({ api }: { api: Application }): Promise<boolean> {
    const deviceFetcherRuns = await WeatherFetcher.getDeviceFetcherRuns({ api });
    return deviceFetcherRuns > 0;
  }

  static async isDeviceFetcherFirstRun({ api }: { api: Application }): Promise<boolean> {
    const deviceFetcherRuns = await WeatherFetcher.getDeviceFetcherRuns({ api });
    return deviceFetcherRuns === 1;
  }

  static initEvents({ api }: { api: Application }, cb: (arg0: WeatherFetcher) => void): void {
    log.info('Listening for flow events');

    const onFlowDataChanged = async (flow: FlowMapParams) => {
      const initialCheckPass =
        // We are looking for just completed
        flow.status === 'complete' &&
        // ... DeviceFetcher flows
        flow.name === 'DeviceFetcher';
      if (initialCheckPass) {
        // ... and it's their DeviceFetcher first complete run
        const isDeviceFetcherFirstRun = await WeatherFetcher.isDeviceFetcherFirstRun({ api });
        if (isDeviceFetcherFirstRun) {
          WeatherFetcher.bootstrap({ api }, cb);
        }
      }
    };

    api
      .service('flows')
      .on('updated', (flow: FlowMapParams) => onFlowDataChanged(flow))
      .on('patched', (flow: FlowMapParams) => onFlowDataChanged(flow));
  }

  static async bootstrap({ api }: { api: Application }, cb: (arg0: WeatherFetcher) => void): Promise<void> {
    log.info('Adding all devices in WeatherFetcher loop');
    const deviceIds: string[] = [];
    const $limit = 500;
    let $skip = 0;
    let total;
    do {
      const response = await api.service('devices').find({
        query: {
          $select: ['_id'],
          $limit,
          $skip,
        },
      });
      const { data } = response;
      total = response.total;
      data.forEach(({ _id }: { _id: string }) => deviceIds.push(_id));
      $skip += $limit;
    } while (total > $skip);

    const devicesAlreadyRun = await WeatherFetcher.devicesAlreadyRun({ api });
    if (devicesAlreadyRun) {
      deviceIds.forEach((deviceId) => cb(new WeatherFetcher({ api, deviceId })));

      log.info(`Added ${deviceIds.length} weather flows in loop`);
    }

    WeatherFetcher.initEvents({ api }, cb);
  }

  constructor({ api, deviceId }: { api: Application; deviceId: string }) {
    super();
    this.api = api;
    this.deviceId = deviceId;
    this.name = `WeatherFetcher-${deviceId}`;
  }

  errorHooks = [this.genericErrorHook];

  clone(): WeatherFetcher {
    return new WeatherFetcher({
      api: this.api,
      deviceId: this.deviceId,
    });
  }

  async shouldRepeat(): Promise<boolean> {
    // add conditions if needed
    return true;
  }

  protected async execSteps(): Promise<void> {
    this.log.info(`Starting...`);

    const stepCommonDependencies: StepDependencies = {
      api: this.api,
      flowId: this.id,
    };

    await this.steps.weather().run({ ...stepCommonDependencies, deviceId: this.deviceId });

    await this.cleanUp();

    log.info('Finished.');
    return;
  }

  protected async exec(): Promise<void> {
    const repeatDelay = await this.repeatDelay({
      api: this.api,
    });
    console.log(this.name, this.repeatDelay);
    await delay(repeatDelay);
    return this.execSteps();
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
    // If more than 20 seconds have past, we run the flow
    if (diffInSec > 20) return 0;
    // If not, we calc the diff and run it when the time diff reaches 20 seconds
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
