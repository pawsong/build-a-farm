import { EventEmitter } from 'events';
import ThreadPool, {
  Thread,
} from './ThreadPool';
import {
  MW_INIT,
  MW_RESPONSE,
} from './shared';

const ScriptWorker = require('worker!./worker');

export interface CompiledScript {
  [index: string]: string[];
}

// Worker ID, Request ID
class VirtualMachine extends EventEmitter {
  pool: ThreadPool;
  threads: Map<string, Thread>;

  constructor() {
    super();
    this.pool = new ThreadPool();
    this.threads = new Map();
  }

  stop(objectId: string) {
    const thread = this.threads.get(objectId);
    if (thread) {
      this.pool.free(thread);
      this.threads.delete(objectId);
    }
  }

  private initThread(objectId: string) {
    const thread = this.threads.get(objectId);
    if (thread) {
      thread.removeAllListeners();
      thread.restart();
      return thread;
    } else {
      const thread = this.pool.allocate();
      this.threads.set(objectId, thread);
      thread.start();
      return thread;
    }
  }

  execute(objectId: string, scripts: CompiledScript) {
    const thread = this.initThread(objectId);

    thread.addListener('message', (data) => {
      const { requestId, type, params, lastReq } = data;
      this.emit('message', {
        objectId, requestId,
        type, params, lastReq,
      });
    });

    thread.postMessage({ type: MW_INIT, objectId, scripts });
    return thread;
  }

  isRunning(objectId: string) {
    return this.threads.has(objectId);
  }

  sendResponse(objectId: string, requestId: number, response?: any) {
    const worker = this.threads.get(objectId);
    worker.postMessage({ type: MW_RESPONSE, requestId, response });
  }
}

export default VirtualMachine;
