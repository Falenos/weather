import { Flow } from './Flow';
import { EventEmitter } from 'events';
import { remove } from 'lodash';
import bunyan from 'bunyan';

export declare interface ParallelCyclicFlowsQueue {
  on(event: 'FLOW_FINISHED', listener: (flow: Flow) => void): this;
  on(event: 'FLOW_ERROR', listener: (err: any, flow: Flow) => void): this;
}

export class ParallelCyclicFlowsQueue extends EventEmitter {
  private flowsQueue: Flow[] = [];
  private unique = true;
  private needsToExit = false;
  private log = bunyan.createLogger({
    name: 'ParallelCyclicFlowsQueue',
  });

  constructor(unique = true) {
    super();
    this.unique = unique;
    process.on('SIGINT', () => {
      // During development just kill the process immediately
      if (process.env.NODE_ENV === 'development') {
        process.exit(0);
      }
      this.needsToExit = true;
      if (this.flowsQueue.length === 0) {
        this.log.info('Queue is empty. Exiting.');
        process.exit(0);
      } else {
        this.log.info('Queue is NOT empty. Not accepting any more flows. Will exit when queue drains.');
      }
    });
  }

  public add(flow: Flow): void {
    if (this.needsToExit) {
      this.log.info('Process in exit mode. Not adding new flows.');
      if (this.flowsQueue.length === 0) {
        this.log.info('Exiting now.');
        process.exit(0);
      }
      return;
    }
    if (this.unique) {
      // Checking if there is a flow with the specified name and userID already in the list.
      const flowExists = !!this.flowsQueue.find((f) => f.userId === flow.userId && f.name === flow.name);
      if (flowExists) {
        this.log.warn('Flow already exists in queue');
        return;
      }
    }
    this.log.info(
      {
        flowName: flow.name,
        userId: flow.userId,
      },
      'Added a flow in queue'
    );
    this.flowsQueue.push(flow);
    flow
      .run()
      .then(() => {
        this.emit('FLOW_FINISHED', flow);
      })
      .catch((err) => {
        this.emit('FLOW_ERROR', err, flow);
      })
      .finally(async () => {
        this.log.info(
          {
            flowName: flow.name,
            userId: flow.userId,
          },
          'Removed a flow from queue'
        );

        remove(this.flowsQueue, (f) => f === flow);
        if (await flow.shouldRepeat()) {
          this.add(flow.clone());
        }
      });
  }
}
