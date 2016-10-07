interface WorkerNavigator extends Object, NavigatorID, NavigatorOnLine {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

interface WorkerUtils extends Object, WindowBase64 {
    indexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    navigator: WorkerNavigator;
    clearImmediate(handle: number): void;
    clearInterval(handle: number): void;
    clearTimeout(handle: number): void;
    importScripts(...urls: string[]): void;
    setImmediate(handler: any, ...args: any[]): number;
    setInterval(handler: any, timeout?: any, ...args: any[]): number;
    setTimeout(handler: any, timeout?: any, ...args: any[]): number;
}

interface DedicatedWorkerGlobalScope {
    onmessage: (ev: MessageEvent) => any;
    postMessage(data: any): void;
    addEventListener(type: "message", listener: (ev: MessageEvent) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

interface WorkerLocation {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    toString(): string;
}

export interface WorkerGlobalScope extends EventTarget, WorkerUtils, DedicatedWorkerGlobalScope, WindowConsole {
    location: WorkerLocation;
    onerror: (ev: Event) => any;
    self: WorkerGlobalScope;
    close(): void;
    msWriteProfilerMark(profilerMarkName: string): void;
    toString(): string;
    addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "message", listener: (ev: MessageEvent) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}
