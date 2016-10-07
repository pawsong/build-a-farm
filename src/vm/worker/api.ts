import { Interpreter, JsObject } from 'js-interpreter';
import {
  WM_HIGHLIGHT_BLOCK, WmHighlightBlockParams,
} from '../shared';
import ThreadManager from './ThreadManager';
import { WorkerGlobalScope } from './types';
declare const self: WorkerGlobalScope;

function createInitInterpreter(threads: ThreadManager, threadId: number, objectId: string) {
  return function initInterpreter(interpreter: Interpreter, scope: JsObject) {
    interpreter.setProperty(scope, 'highlightBlock', interpreter.createNativeFunction((id) => {
      const blockId = id ? id.toString() : '';
      const message: WmHighlightBlockParams = {
        type: WM_HIGHLIGHT_BLOCK,
        objectId, threadId, blockId,
      };
      self.postMessage(message);
      return interpreter.UNDEFINED;
    }));

    // API

    interpreter.setProperty(scope, 'getNearestVoxels', interpreter.createAsyncFunction((types) => {
      return threads.request(objectId, 'getNearestVoxels', types);
    }));

    interpreter.setProperty(scope, 'moveTo', interpreter.createAsyncFunction((position) => {
      return threads.request(objectId, 'moveTo', position);
    }));

    interpreter.setProperty(scope, 'use', interpreter.createAsyncFunction((position) => {
      return threads.request(objectId, 'use', position);
    }));

    interpreter.setProperty(scope, 'jump', interpreter.createAsyncFunction(() => {
      return threads.request(objectId, 'jump');
    }));
  }
}

export { createInitInterpreter }
