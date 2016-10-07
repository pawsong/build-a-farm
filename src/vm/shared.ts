interface BaseParams {
  type: string;
}

export interface WmBaseParams extends BaseParams {
  objectId: string;
  threadId: number;
}

export const WM_STOPPED = 'WM_STOPPED';

export const MW_STOP = 'MW_STOP';
export interface MwStopParams {
  objectId: string;
}

export const MW_RUN = 'MW_RUN';
export interface MwRunParams {
  objectId: string;
  threadId: number;
  code: string;
}

export const MW_API_RESPONSE = 'MW_API_RESPONSE';
export interface MwResponseParams {
  requestId: number;
  params: any;
}

export const WM_API_REQUEST = 'WM_API_REQUEST';
export interface WmApiRequestParams extends WmBaseParams {
  requestId: number;
  api: string;
  body: any;
}

export const WM_THREAD_START = 'WM_THREAD_START';
export interface WmThreadStartParams extends WmBaseParams {
}

export const WM_THREAD_STOP = 'WM_THREAD_STOP';
export interface WmThreadStopParams extends WmBaseParams {
}
