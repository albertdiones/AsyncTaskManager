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
  queue: Array< () => Promise<any>> = [];
  running: boolean = false;

  constructor(
    options: {
      logger?: LoggerInterface
    } = {}
  ) {
    this.logger = options.logger ?? null;
  }
  _queue(task: () => Promise<any>): Promise<any> {
    return new Promise(
      (resolve, reject) => {
        this.queue.push(
          () => {
            return Promise.resolve(task())
              .then(resolve)
              .catch(reject);
          }
        );    
        if (!this.running) {
            this._runNext();
        }
      }
    );    
  }

  _runNext() {
    const nextTask = this.queue.shift();
    if (!nextTask) {
      this.running = false;
      return;
    }
    this.running = true;
    return nextTask().then(
      () => this._runNext()
    );
  }

  add(task: () => any, name?: string): Promise<any> {

    this.logger?.info(`Scheduling task: ${name ?? 'unnamed'}`);

    return this._queue(task);
  }

  abortAllQueue() {
    this.queue = [];
  }
}

/**
 * A manager of async task that puts a delay time after the previous task
 * e.g. to avoid throtling when fetching apis
 */
export class PaddedScheduleManager extends SequentialTaskManager {
    

  minTimeout: number;
  maxRandomTimeout: number;

  constructor(
    minTimeoutPerTask: number,
    maxRandomPreTaskTimeout: number,
    options: {
      logger?: LoggerInterface
    } = {}
  ) {
    super({logger: options?.logger});
    this.minTimeout = minTimeoutPerTask;
    this.maxRandomTimeout = maxRandomPreTaskTimeout;
  }

  _generateTimeout() {
    
    // no random delay, just fixed min timeout
    if (this.maxRandomTimeout <= 0) {
        return this.minTimeout;
    }

    return this.minTimeout 
    + ( Math.random() * this.maxRandomTimeout );
  }
  
  _runNext() {
    if (this.running) {
      const timeout: number = this._generateTimeout();
      return Bun.sleep(timeout).then(
        () => super._runNext()
      )
    }
    return super._runNext();
  }
}