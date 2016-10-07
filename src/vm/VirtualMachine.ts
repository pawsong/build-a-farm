import { EventEmitter } from 'events';
import {
  WmBaseParams,
  MW_RUN,
  MW_STOP,
  MW_API_RESPONSE,
  WM_THREAD_START, WmThreadStartParams,
  WM_THREAD_STOP, WmThreadStopParams,
  WM_API_REQUEST, WmApiRequestParams,
} from './shared';
import IdIssuer from './IdIssuer';
const ScriptWorker = require('worker!./worker');

class ChildProcess {
  threads: Set<number /* threadId */>;
  worker: Worker;

  private vm: VirtualMachine;

  constructor(vm: VirtualMachine) {
    this.vm = vm;
    this.threads = new Set();

    this.worker = new ScriptWorker();
    this.worker.addEventListener('message', this.handleMessage);
  }

  public run(objectId: string, threadId: number, code: string) {
    this.worker.postMessage({ type: MW_RUN, objectId, threadId, code });
  }

  public stop(objectId: string) {
    this.worker.postMessage({ type: MW_STOP, objectId });
  }

  public sendResponse(objectId: string, requestId: number, params?: any) {
    this.worker.postMessage({ type: MW_API_RESPONSE, requestId, params });
  }

  private handleMessage = (event: MessageEvent) => {
    switch(event.data.type) {
      case WM_THREAD_START: {
        const { threadId } = <WmThreadStartParams> event.data;
        this.threads.add(threadId);
        break;
      }
      case WM_THREAD_STOP: {
        const { threadId } = <WmThreadStopParams> event.data;
        this.threads.delete(threadId);
        break;
      }
    }
  }
}

export interface ThreadInfo {
  threadId: number;
  objectId: string;
  process: ChildProcess;
}

class VirtualMachine extends EventEmitter {
  static threadIdIssuer = new IdIssuer();

  // Source of truth
  threads: Map<string /* objectId */, ThreadInfo>;

  private children: ChildProcess[];

  constructor(numOfChildren: number) {
    super();

    this.threads = new Map();

    this.children = [];
    for (let i = 0; i < numOfChildren; ++i) {
      const child = new ChildProcess(this);
      child.worker.addEventListener('message', this.handleMessage);
      this.children.push(child);
    }
  }

  public run(objectId: string, code: string) {
    this.stop(objectId);

    const threadId = VirtualMachine.threadIdIssuer.issue();

    const child = this.getLazyProcess();
    child.run(objectId, threadId, code);

    const thread: ThreadInfo = {
      objectId,
      threadId,
      process: child,
    };
    this.threads.set(objectId, thread);

    return thread;
  }

  public stop(objectId: string) {
    const thread = this.threads.get(objectId);
    if (thread) {
      thread.process.stop(objectId);
      this.removeThread(thread);
    }
  }

  public getThreadInfo(objectId: string) {
    return this.threads.get(objectId);
  }

  private getLazyProcess() {
    let result = this.children[0];
    for (let i = 1, len = this.children.length; i < len; ++i) {
      const child = this.children[i];
      if (result.threads.size > child.threads.size) {
        result = child;
      }
    }
    return result;
  }

  private handleMessage = (event: MessageEvent) => {
    const { objectId, threadId } = <WmBaseParams> event.data;
    const thread = this.threads.get(objectId);
    if (!thread || thread.threadId !== threadId) return;

    switch(event.data.type) {
      case WM_THREAD_START: {
        this.emit('start', objectId);
        break;
      }
      case WM_THREAD_STOP: {
        this.removeThread(thread);
        break;
      }
      case WM_API_REQUEST: {
        this.emit('api', thread.process, event.data);
        break;
      }
      default: {
        break;
      }
    }
  }

  private removeThread(thread: ThreadInfo) {
    this.threads.delete(thread.objectId);
    this.emit('stop', thread);
  }
}

interface VirtualMachine {
  emit(event: 'stop', thread: ThreadInfo): boolean;
  on(event: 'stop', listener: (thread: ThreadInfo) => any): this;

  emit(event: 'api', child: ChildProcess, params: WmApiRequestParams): boolean;
  on(event: 'api', listener: (child: ChildProcess, params: WmApiRequestParams) => any): this;

  emit(event: string, ...args: any[]): boolean;
  on(event: string, listener: Function): this;
}

export default VirtualMachine;
