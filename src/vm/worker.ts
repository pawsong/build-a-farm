console.log(0, performance.now());

import 'babel-polyfill';

import ndarray from 'ndarray';
const Babel = require('babel-standalone');

import { WorkerGlobalScope } from './types';

declare const self: WorkerGlobalScope;

interface Request {
  resolve: any;
  reject: any;
}

interface RequestInfo {
  type: string;
  params: any;
}

self.onmessage = e => {
  switch(e.data.type) {
    case 'init': {
      const { objectId, scripts } = e.data;

      const compiled = {};
      const events = Object.keys(scripts);

      for (const event of events) {
        const compiledFuncs = [];
        const list = scripts[event];

        for (const script of list) {
          const result = Babel.transform(script, { presets: ['stage-0', 'es2015'] });
          compiledFuncs.push(eval(result.code));
        }
        compiled[event] = compiledFuncs;
      }

      for (const func of compiled['when_run']) func();
      break;
    }
    case 'resp': {
      const { requestId, response } = e.data;
      const { resolve } = requests.get(requestId);
      resolve(response);
      break;
    }
  }
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
