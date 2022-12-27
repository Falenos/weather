import { Application } from '@feathersjs/feathers';
import { FlowMapParams, StepDependencies } from '@models';
import bunyan from 'bunyan';
import { Flow } from '../../lib/Flow';
import { Weather } from './steps/Weather';
const log = bunyan.createLogger({ name: 'WEATHER_FETCHER' });

export class WeatherFetcher extends Flow {
  name = 'WeatherFetcher';
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
    return false;
  }

  protected async exec(): Promise<void> {
    this.log.info(`Starting...`);

    const stepCommonDependencies: StepDependencies = {
      api: this.api,
      flowId: this.id,
    };

    await this.steps.weather().run({ ...stepCommonDependencies, deviceId: this.deviceId });

    log.info('Finished.');
    return;
  }
}
