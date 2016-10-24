import { Interpreter, JsObject } from 'js-interp';
import {
  MW_STOP, MwStopParams,
  MW_RUN, MwRunParams,
  MW_API_RESPONSE, MwResponseParams,
} from '../shared';
import ThreadManager from './ThreadManager';
import { WorkerGlobalScope } from './types';
declare const self: WorkerGlobalScope;

const VM_FPS = 100;

const threads = new ThreadManager();
setInterval(() => threads.onTick(), 1000 / VM_FPS);

self.onmessage = e => {
  switch(e.data.type) {
    case MW_RUN: {
      const { objectId, threadId, code } = <MwRunParams> e.data;
      threads.spawn(objectId, threadId, code);
      break;
    }
    case MW_STOP: {
      const { objectId } = <MwStopParams> e.data;
      threads.terminate(objectId);
      break;
    }
    case MW_API_RESPONSE: {
      const { requestId, params } = <MwResponseParams> e.data;
      threads.onResponse(requestId, params);
      break;
    }
  }
}
