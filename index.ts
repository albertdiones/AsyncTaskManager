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


export class PaddedScheduleManager implements AsyncTaskManagerInterface {
    

  minTimeout: number;
  maxRandomTimeout: number;
  logger: LoggerInterface | null;
  queue: Array<() => any> = [];
  lastFinishTime: number | null = null;

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

    if (!this.lastFinishTime && this.queue.length <= 0) {
        console.log('this.lastFinishTime', this.lastFinishTime, this.queue.length);
        return 0;
    }
    
    const consumedTimeout = Date.now() - this.lastFinishTime;
    
    // no random delay, just fixed min timeout
    if (this.maxRandomTimeout <= 0) {
        return this.minTimeout;
    }

    const targetTimeout = this.minTimeout + ( Math.random() * this.maxRandomTimeout );


    const netTimeout = Math.max(targetTimeout - consumedTimeout,0);

    console.log('netTimeout', netTimeout);

    return netTimeout;
  }

  _queueAndExecute(task: () => Promise<any>, timeout: number) {
    if (timeout > 0) {// negative delay will also be done instantly)  
        task = () => Bun.sleep(timeout).then(
            () => task()
        );
    }
    // HOW WOULD I END UP RETURNING THE RESULT OF task()
    this.queue.push( () => task() );

    return Promise.resolve(this._shiftAndExecute())
    .then(
        () => {
            console.log('FINISH!!!');
            this.lastFinishTime = Date.now();
            if (this.queue?.length > 0) {
                return this._shiftAndExecute()
            }
        }
    );
  }

  

  _shiftAndExecute() {
    const nextTask = this.queue.shift();
    if (!nextTask) {
        return Promise.resolve();
    }
    return Promise.resolve(nextTask());
  }

  add(task: () => any, name?: string): Promise<any> {

      const timeout = this._generateTimeout()

      this.logger?.info(`Scheduling task: ${name} (delay: ${timeout})`);

      return this._queueAndExecute(task,timeout);
    }
}