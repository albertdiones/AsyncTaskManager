import type { Logger, LoggerInterface } from "add_logger";

/**
 * 
 * 
 */
export interface AsyncTaskManagerInterface {


  /*
    * add(task)
    * e.g. 
    * add(() => fetch('http://google.com/api/blahblah')).then();
    * 
    * 
    */
  add(task: () => Promise<any>, name?: string): Promise<any>;
}

/**
 * A task schedule manager, which enables management of asynchronous 
 * minTimeoutPerTask - minimum delay for each task
 * maxRandomPreTaskTimeout - random time interval in before each task
 */
export class PaddedScheduleManager implements AsyncTaskManagerInterface {


  minTimeout: number;
  maxRandomTimeout: number;
  logger: LoggerInterface | null;
  
  lastTaskSchedule: number | null;

  constructor(
    minTimeoutPerTask: number,
    maxRandomPreTaskTimeout: number,
    options: {
      logger?: LoggerInterface
    } = {}
  ) {
    this.minTimeout = minTimeoutPerTask;
    this.maxRandomTimeout = maxRandomPreTaskTimeout;
    this.logger = options.logger ?? null;
    this.lastTaskSchedule = null;
  }

  _generateTimeout() {
    const randomDelay = this.maxRandomTimeout > 0 ? Math.random()*this.maxRandomTimeout : 0;
    return this.minTimeout 
          + randomDelay;
  }

  add(task: () => any, name?: string): Promise<any> {

      // first task = no delay
      let timeout = 0;   
      if (this.lastTaskSchedule) {
        // existing queue = calculate the delay
        timeout = 
          (this.lastTaskSchedule - Date.now())
          + this._generateTimeout()
      }     

      this.lastTaskSchedule = Date.now() + timeout;

      this.logger?.info(`Scheduling task: ${name} (delay: ${timeout})`);

      return (
        timeout <= 0 // negative delay will also be done instantly
        ? task()
        : Bun.sleep(timeout).then(
            () => task()
        )
      );
    }
}


export const noDelayScheduleManager = new PaddedScheduleManager(0,0);