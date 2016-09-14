import { EventEmitter } from 'events';

const ScriptWorker = require('worker!./worker');
type AbstractWorke = AbstractWorker;

export interface CompiledScript {
  [index: string]: string[];
}

// Worker ID, Request ID
class VirtualMachine extends EventEmitter {
  workers: Map<string, Worker>;

  constructor() {
    super();
    this.workers = new Map();
  }

  spawn(objectId: string) {
    if (this.workers.has(objectId)) {
      this.workers.get(objectId).terminate();
    }

    const worker: Worker = new ScriptWorker();
    this.workers.set(objectId, worker);

    return worker;
  }

  execute(objectId: string, scripts: CompiledScript) {
    const worker = this.workers.get(objectId);

    worker.onmessage = (e) => {
      const { requestId, type, params, lastReq } = e.data;
      this.emit('message', {
        objectId, requestId,
        type, params, lastReq,
      });
    };

    worker.postMessage({ type: 'init', objectId, scripts });

    return worker;
  }

  postMessage(objectId: string, requestId: number, response?: any) {
    const worker = this.workers.get(objectId);
    worker.postMessage({ type: 'resp', requestId, response });
  }
}

export default VirtualMachine;
