import { ApiStep } from '@flows/ApiStep';
import { StepDependencies } from '@models';
import { differenceInMinutes, parseISO } from 'date-fns';
import { get } from 'lodash';

interface Dependencies extends StepDependencies {}

export class Devices extends ApiStep<Dependencies, void> {
  name = 'Devices';

  private runAt!: Date;

  beforeHooks = [
    (): void => {
      this.log.info('Starting');
    },
    async (): Promise<void> => {
      const { data } = await this.api.service('steps').find({
        query: {
          // We are only interested in the same type of steps
          name: this.name,
          status: 'complete',
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
      // We run this flow once every 120 minutes
      if (differenceInMinutes(new Date(), runAt) <= 120) {
        // should skip
        this.skip = true;
        this.log.info('Skipping');
      }
    },
  ];

  afterHooks = [
    async (data: any): Promise<void> => {
      // console.log(data);
      await this.populateDevices(data);
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
    };
  }

  private async populateDevices(devices: any[]) {
    const data = devices.map(
      (device: {
        id: string;
        name: string;
        location: {
          lat: number;
          lon: number;
        };
        attributes: {
          lastActiveAt: string;
        };
      }) => ({
        deviceId: device.id,
        name: device.name,
        location: device.location,
        lastActiveAt: new Date(device.attributes.lastActiveAt),
      })
    );
    this.api.service('devices').create(data);
  }

  private async getDevices(): Promise<any> {
    const res = await this.fetch({
      method: 'get',
      url: 'devices',
    });
    return res.data;
  }

  protected async exec(): Promise<any[]> {
    return this.getDevices();
  }
}
