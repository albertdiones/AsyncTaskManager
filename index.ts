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


  minTimeoutPerTask: number;
  maxRandomPreTaskTimeout: number;
  logger: LoggerInterface | null;
  
  lastTaskSchedule: number | null;

  constructor(
    minTimeoutPerTask: number,
    maxRandomPreTaskTimeout: number,
    options: {
      logger?: LoggerInterface
    } = {}
  ) {
    this.minTimeoutPerTask = minTimeoutPerTask;
    this.maxRandomPreTaskTimeout = maxRandomPreTaskTimeout;
    this.logger = options.logger ?? null;
    this.lastTaskSchedule = null;
  }

  add(task: () => any, name?: string): Promise<any> {
      const randomDelay = this.maxRandomPreTaskTimeout > 0 ? Math.random()*this.maxRandomPreTaskTimeout : 0;

      // first task = no delay
      let delayBeforeTask = 0;   
      if (this.lastTaskSchedule) {
        // existing queue = calculate the delay
        delayBeforeTask = 
          (this.lastTaskSchedule - Date.now())
          + this.minTimeoutPerTask 
          + randomDelay;
      }     

      this.lastTaskSchedule = Date.now() + delayBeforeTask;

      this.logger?.info(`Scheduling task: ${name} (delay: ${delayBeforeTask})`);

      return (
        delayBeforeTask <= 0 // negative delay will also be done instantly
        ? task()
        : Bun.sleep(delayBeforeTask).then(
            () => task()
        )
      );
    }
}


export const noDelayScheduleManager = new PaddedScheduleManager(0,0);