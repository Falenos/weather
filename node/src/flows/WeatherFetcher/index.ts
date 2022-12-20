import { Application } from '@feathersjs/feathers';
import { StepDependencies } from '@models';
import bunyan from 'bunyan';
import { Flow } from '../../lib/Flow';
const log = bunyan.createLogger({ name: 'WEATHER_FETCHER' });

export class WeatherFetcher extends Flow {
  name = 'WeatherFetcher';
  public type = WeatherFetcher;

  readonly steps = {
    // weather: () => new Weather(),
  };

  static async bootstrap({ api }: { api: Application }, cb: (arg0: WeatherFetcher) => void): Promise<void> {
    log.info('Adding all users in WeatherFetcher loop');
    const deviceIds: string[] = [];
    const $limit = 500;
    let $skip = 0;
    let total;
    do {
      const response = await api.service('devices').find({
        query: {
          permissions: { $ne: 'admin' },
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

    deviceIds.forEach(() => cb(new WeatherFetcher({ api })));

    log.info(`Added ${deviceIds.length} devices in loop`);
  }

  constructor({ api }: { api: Application }) {
    super();
    this.api = api;
  }

  errorHooks = [this.genericErrorHook];

  clone(): WeatherFetcher {
    return new WeatherFetcher({
      api: this.api,
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

    // await this.steps.weather().run(stepCommonDependencies);

    log.info('Finished.');
    return;
  }
}
