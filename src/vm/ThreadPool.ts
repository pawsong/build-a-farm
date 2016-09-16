import { EventEmitter } from 'events';
const ScriptWorker = require('worker!./worker');
import {
  HEARTBEAT_INTERVAL,
  WM_HEARTBEAT,
  MW_STOP,
  WM_STOPPED,
} from './shared';

const EVENT_ERROR = 'error';

class Thread extends EventEmitter {
  worker: Worker;
  heartbeatId: number;
  private heartbeatArrivedAt: number;

  constructor() {
    super();

    this.worker = new ScriptWorker();
  }

  start() {
    this.worker.addEventListener('message', this.handleWorkerMessage, false);

    // this.heartbeatArrivedAt = Date.now();
    // this.heartbeatId = <any>setInterval(() => {
    //   if (Date.now() - this.heartbeatArrivedAt > 5 * HEARTBEAT_INTERVAL) {
    //     this.emit(EVENT_ERROR, new Error('Thread is frozen'));
    //     this.kill();
    //   }
    // }, HEARTBEAT_INTERVAL);
  }

  restart() {
    // TODO: Graceful stop
    this.worker.postMessage({ type: MW_STOP });
  }

  private handleWorkerMessage = (message: MessageEvent) => {
    switch(message.type) {
      case WM_HEARTBEAT: {
        this.heartbeatArrivedAt = Date.now();
        break;
      }
      default: {
        this.emit('message', message.data);
      }
    }
  }

  postMessage(message: any) {
    this.worker.postMessage(message);
  }

  stop() {
    this.removeAllListeners();
    clearInterval(this.heartbeatId);
    this.worker.removeEventListener('message', this.handleWorkerMessage, false);

    // TODO: Graceful stop
    this.worker.postMessage({ type: MW_STOP });
  }

  kill() {
    this.stop();
    this.worker.terminate();
    this.worker = null;
  }
}

export { Thread }

class ThreadPool {
  idle: Thread[];

  constructor() {
    this.idle = [new Thread()];
  }

  allocate() {
    const thread = this.idle.pop();
    if (this.idle.length === 0) this.idle.push(new Thread());
    return thread;
  }

  free(thread: Thread) {
    thread.stop();
    this.idle.push(thread);
  }
}

export default ThreadPool;
