import { DeviceFetcher } from '@flows/DeviceFetcher';
// import { WeatherFetcher } from '@flows/WeatherFetcher';
import initApi from './Api';
import { ParallelCyclicFlowsQueue } from './ParallelCyclicFlowsQueue';
import { SeriesFlowsQueue } from './SeriesFlowsQueue';

export class Manager {
  static seriesFlowsQueue = new SeriesFlowsQueue();
  static parallelCyclicFlowsQueue = new ParallelCyclicFlowsQueue();
  static async init(): Promise<void> {
    const api = await initApi();

    DeviceFetcher.bootstrap({ api }, (flow) => {
      this.parallelCyclicFlowsQueue.add(flow);
    });

    // WeatherFetcher.bootstrap({ api }, (flow) => {
    //   this.parallelCyclicFlowsQueue.add(flow);
    // });
  }
}
