import 'babel-polyfill';

import ndarray from 'ndarray';
const babel = require('babel-standalone');

import { WorkerGlobalScope } from './types';
import {
  MW_INIT,
  MW_RESPONSE,
  MW_STOP,
  WM_HEARTBEAT,
  HEARTBEAT_INTERVAL,
} from './shared';

declare const self: WorkerGlobalScope;

interface Request {
  resolve: any;
  reject: any;
}

interface RequestInfo {
  type: string;
  params: any;
}

let lastReq: RequestInfo = null;

const requests: Map<number, Request> = new Map();
const issueRequestId = (() => {
  let requestId = 0;
  return () => ++requestId;
})();

function request(resolve: any, reject: any, type: string, params?: any) {
  const requestId = issueRequestId();
  requests.set(requestId, { resolve, reject });

  self.postMessage({ requestId, type, params, lastReq });
  lastReq = { type, params };
}

self['getNearestVoxels'] = function getNearestVoxels(types) {
  return new Promise((resolve, reject) => request(resolve, reject, 'getNearestVoxels', types));
}

self['moveTo'] = function moveTo(position) {
  return new Promise((resolve, reject) => request(resolve, reject, 'moveTo', position));
}

self['use'] = function use() {
  return new Promise((resolve, reject) => request(resolve, reject, 'use'));
}

// setInterval(() => {
//   self.postMessage({ type: WM_HEARTBEAT });
// }, HEARTBEAT_INTERVAL);

// Handler
function stop() {
  requests.clear();
}

self.onmessage = e => {
  switch(e.data.type) {
    case MW_INIT: {
      stop();

      const { objectId, scripts } = e.data;

      const compiled = {};
      const events = Object.keys(scripts);

      for (const event of events) {
        const compiledFuncs = [];
        const list = scripts[event];

        for (const script of list) {
          const result = babel.transform(script, { presets: ['stage-0', 'es2015'] });
          compiledFuncs.push(eval(result.code));
        }
        compiled[event] = compiledFuncs;
      }

      for (const func of compiled['when_run']) func();
      break;
    }
    case MW_RESPONSE: {
      const { requestId, response } = e.data;
      const request = requests.get(requestId);
      if (request) {
        const { resolve } = request;
        resolve(response);
      }
      break;
    }
    case MW_STOP: {
      stop();
      break;
    }
  }
}
