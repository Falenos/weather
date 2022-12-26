import { Application } from '@feathersjs/feathers';
import { StepDependencies } from '@models';
import bunyan from 'bunyan';
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
    // TODO: add checks here and return true
    return false;
  }

  protected async exec(): Promise<void> {
    this.log.info(`Starting...`);

    const stepCommonDependencies: StepDependencies = {
      api: this.api,
      flowId: this.id,
    };

    await this.steps.devices().run(stepCommonDependencies);

    log.info('Finished.');
    return;
  }
}
