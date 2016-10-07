import { Interpreter, JsObject } from 'js-interpreter';
import ThreadManager from './ThreadManager';

function createInitInterpreter(threads: ThreadManager, objectId: string) {
  return function initInterpreter(interpreter: Interpreter, scope: JsObject) {
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
