import { ApiStep } from '@flows/ApiStep';
import { StepDependencies } from '@models';
import { differenceInMinutes, parseISO } from 'date-fns';
import { get } from 'lodash';

interface Dependencies extends StepDependencies {
  deviceId: string;
}

export class Weather extends ApiStep<Dependencies, void> {
  name = 'Weather';

  private runAt!: Date;

  beforeHooks = [
    (): void => {
      this.log.info('Starting');
    },
    async (): Promise<void> => {
      const { data } = await this.api.service('steps').find({
        query: {
          // We are only interested in the same type of steps
          // And the same user
          name: this.name,
          status: 'complete',
          'meta.deviceId': this.dependencies.deviceId,
          $limit: 1,
          $select: ['meta', 'updatedAt'],
          $sort: {
            updatedAt: -1,
          },
        },
      });
      // Getting the time that the previous step of this type run.
      let runAt = get(data, '[0].meta.runAt', null);
      runAt = runAt && parseISO(runAt);
      if (!runAt) return;
      this.log.info(`Previous flow run ${differenceInMinutes(new Date(), runAt)} minutes ago`);
      // We run this flow once every 1 minutes
      // TODO: activate skip logic
      // if (differenceInMinutes(new Date(), runAt) <= 1) {
      //   // should skip
      //   this.skip = true;
      //   this.log.info('Skipping');
      // }
    },
  ];

  afterHooks = [
    async (data: any): Promise<void> => {
      console.log(data);
      await this.populateWeather(data);
    },
    (): void => {
      this.runAt = new Date();
      this.log.info(`Finished.`);
    },
  ];

  get meta(): any {
    return {
      ...super.meta,
      runAt: this.runAt,
      deviceId: this.dependencies.deviceId,
    };
  }

  constructor() {
    super();
  }

  private async populateWeather(device: {
    id: string;
    current_weather: {
      timestamp: string;
      temperature: number;
      humidity: number;
      wind_speed: number;
      icon: string;
    };
  }) {
    return this.api.service('weather').create({
      deviceId: device.id,
      timestamp: new Date(device.current_weather.timestamp),
      temperature: device.current_weather.temperature,
      humidity: device.current_weather.humidity,
      windSpeed: device.current_weather.wind_speed,
      icon: device.current_weather.icon,
    });
  }

  private async getWeather(deviceId: string): Promise<any> {
    const res = await this.fetch({
      method: 'get',
      url: `devices/${deviceId}`,
    });
    return res.data;
  }

  protected async exec({ deviceId }: Dependencies): Promise<any[]> {
    return this.getWeather(deviceId);
  }
}
