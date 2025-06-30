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
export class FixedIntervalTaskManager implements AsyncTaskManagerInterface {


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
    
    // no random delay, just fixed min timeout
    if (this.maxRandomTimeout <= 0) {
        return this.minTimeout;
    }

    return this.minTimeout 
    + ( Math.random() * this.maxRandomTimeout );
  }

  _setTimeout(task: () => Promise<any>, timeout: number): Promise<any> {
    if (timeout <= 0) {// negative delay will also be done instantly)  
        return Promise.resolve(task());
    }
    return Bun.sleep(timeout).then(
        () => task()
    );
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

      return this._setTimeout(task,timeout);
    }
}


export const noDelayScheduleManager = new FixedIntervalTaskManager(0,0);

/**
 * An async task manager that executes each task, 1 by 1 with no delay
 * 1 after the other
 */
export class SequentialTaskManager implements AsyncTaskManagerInterface {
  
  logger: LoggerInterface | null;
  queue: Promise<any> | null;

  constructor(
    options: {
      logger?: LoggerInterface
    } = {}
  ) {
    this.logger = options.logger ?? null;
  }
  _queue(task: () => Promise<any>): Promise<any> {
    if (!this.queue) {
        this.queue = Promise.resolve(task()).finally(
            () => {
                this.queue = null;
            }
        );
        return this.queue;
    }
    this.queue = this.queue.then(
        () => {
            return task()
        }
    );
    return this.queue;
  }

  add(task: () => any, name?: string): Promise<any> {

    this.logger?.info(`Scheduling task: ${name ?? 'unnamed'}`);

    return this._queue(task);
  }
}

/**
 * A manager of async task that puts a delay time after the previous task
 * e.g. to avoid throtling when fetching apis
 */
export class PaddedScheduleManager implements AsyncTaskManagerInterface {
    

  minTimeout: number;
  maxRandomTimeout: number;
  logger: LoggerInterface | null;
  queue: Promise<any> | null;

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
  }

  _generateTimeout() {
    
    // no random delay, just fixed min timeout
    if (this.maxRandomTimeout <= 0) {
        return this.minTimeout;
    }

    return this.minTimeout 
    + ( Math.random() * this.maxRandomTimeout );
  }

  _queue(task: () => Promise<any>, timeout: number): Promise<any> {
    if (!this.queue) {
        this.queue = Promise.resolve(task()).finally(
            () => {
                this.queue = null;
            }
        );
        return this.queue;
    }
    this.queue = this.queue.then(
        () => {
            return Bun.sleep(timeout)
        }
    ).then(
        () => {
            return task()
        }
    );;
    return this.queue;
  }

  add(task: () => any, name?: string): Promise<any> {

      // first task = no delay
      let timeout = 0;
      if (this.queue) {
        timeout = this._generateTimeout();
      }

      this.logger?.info(`Scheduling task: ${name ?? 'unnamed'} (delay: ${timeout})`);

      return this._queue(task,timeout);
    }
}