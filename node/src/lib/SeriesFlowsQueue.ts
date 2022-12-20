import { Flow } from './Flow';
import { EventEmitter } from 'events';

export declare interface SeriesFlowsQueue {
  on(event: 'FLOW_FINISHED', listener: (flow: Flow) => void): this;
  on(event: 'FLOW_ERROR', listener: (err: any, flow: Flow) => void): this;
}

export class SeriesFlowsQueue extends EventEmitter {
  private flowsQueue: Flow[] = [];
  private isRunning = false;

  private runFlows = async () => {
    if (this.isRunning) return;
    this.isRunning = true;
    while (this.flowsQueue.length) {
      const flow = this.flowsQueue.shift();
      if (flow) {
        const runner = flow.run();
        runner
          .then(() => {
            this.emit('FLOW_FINISHED', flow);
          })
          .catch((err) => {
            this.emit('FLOW_ERROR', err, flow);
          });
        await runner;
      }
    }
    this.isRunning = false;
  };

  public add(flow: Flow): void {
    this.flowsQueue.push(flow);
    this.runFlows();
  }
}
