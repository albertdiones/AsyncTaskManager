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
  queue: Promise<any> | null;
  queueDone: boolean = true;
  lastExecutionFinish: number | null = null;

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
    

    let sleepThenExecute;
    
    const timeoutConsumed = this.lastExecutionFinish ? Date.now() - this.lastExecutionFinish : 0;
    const netTimeout = timeout - timeoutConsumed;

    if (netTimeout > 0) {// negative delay will also be done instantly)  
        sleepThenExecute = () => Bun.sleep(netTimeout).then(
            () => {
                console.log('4636132135');
                return task();
            }
        );
    }
    else {
        sleepThenExecute = () => Promise.resolve(task());
    }
    let result;
    const newTaskChain = () => sleepThenExecute().then(
        (taskResult) => {
            result = taskResult;
            return result; // useless, voided
        }
    );
    return this.queue = newTaskChain().finally(
        () => {
            this.lastExecutionFinish = Date.now();
            return result;
        }
    );
  }

  add(task: () => any, name?: string): Promise<any> {

      // first task = no delay
      let timeout = 0;   
      if (!this.queueDone) {
        timeout = this._generateTimeout()
      }

      this.logger?.info(`Scheduling task: ${name ?? 'unnamed'} (delay: ${timeout})`);

      return this._queue(task,timeout);
    }
}