import { Application } from '../declarations';
import devices from './devices/devices.service';
import flows from './flows/flows.service';
import steps from './steps/steps.service';
import weather from './weather/weather.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(devices);
  app.configure(flows);
  app.configure(steps);
  app.configure(weather);
}
