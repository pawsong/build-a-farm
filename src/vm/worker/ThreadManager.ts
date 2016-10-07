import { Interpreter, JsObject } from 'js-interpreter';
import IdIssuer from '../IdIssuer';
import { createInitInterpreter } from './api';
import {
  WM_THREAD_START, WmThreadStartParams,
  WM_THREAD_STOP, WmThreadStopParams,
  WM_API_REQUEST, WmApiRequestParams,
} from '../shared';
import { WorkerGlobalScope } from './types';
declare const self: WorkerGlobalScope;

const requestIdIssuer = new IdIssuer();

interface Thread {
  objectId: string;
  threadId: number;
  interpreter: Interpreter;
  pendingRequests: Set<number>;
}

interface Request {
  objectId: string;
  resolve: (result?: any) => any;
  reject: (err: any) => any;
}

class ThreadManager {
  private threads: Thread[];
  private threadsByObjectId: Map<string, Thread>;

  private pendingRequests: Map<number, Request>;

  constructor() {
    this.threads = [];
    this.threadsByObjectId = new Map();
    this.pendingRequests = new Map();
  }

  spawn(objectId: string, threadId: number, code: string) {
    this.terminate(objectId);

    const thread: Thread = {
      objectId,
      threadId,
      interpreter: new Interpreter(code, createInitInterpreter(this, threadId, objectId)),
      pendingRequests: new Set(),
    };
    this.threads.push(thread);
    this.threadsByObjectId.set(thread.objectId, thread);

    const message: WmThreadStartParams = {
      type: WM_THREAD_START,
      objectId: thread.objectId,
      threadId: thread.threadId,
    };

    self.postMessage(message);
  }

  terminate(objectId: string) {
    const thread = this.threadsByObjectId.get(objectId);
    if (thread) {
      this.destroyThread(thread, this.threads.indexOf(thread));
    }
  }

  onTick() {
    for (let i = this.threads.length - 1; i >= 0; --i) {
      const thread = this.threads[i];
      if (!thread.interpreter.step()) {
        this.destroyThread(thread, i);
      }
    }
  }

  request(objectId: string, api: string, params?: any) {
    const thread = this.threadsByObjectId.get(objectId);
    if (!thread) throw new Error(`Cannot find thread for object ${objectId}`);

    return new Promise((resolve, reject) => {
      const requestId = requestIdIssuer.issue();

      this.pendingRequests.set(requestId, { objectId, resolve, reject });
      thread.pendingRequests.add(requestId);

      const message: WmApiRequestParams = {
        objectId, requestId, api,
        type: WM_API_REQUEST,
        body: params && thread.interpreter.pseudoToNative(params),
        threadId: thread.threadId,
      };

      self.postMessage(message);
    });
  }

  onResponse(requestId: number, params: any) {
    const request = this.pendingRequests.get(requestId);
    if (!request) return;

    this.pendingRequests.delete(requestId);

    const thread = this.threadsByObjectId.get(request.objectId);
    if (!thread) return;

    thread.pendingRequests.delete(requestId);

    request.resolve(thread.interpreter.nativeToPseudo(params));
  }

  private destroyThread(thread: Thread, index: number) {
    for (const requestId of thread.pendingRequests) {
      this.pendingRequests.delete(requestId);
    }
    thread.pendingRequests = null;

    this.threads.splice(index, 1);
    this.threadsByObjectId.delete(thread.objectId);

    const message: WmThreadStopParams = {
      type: WM_THREAD_STOP,
      objectId: thread.objectId,
      threadId: thread.threadId,
    };

    self.postMessage(message);
  }
}

export default ThreadManager;
