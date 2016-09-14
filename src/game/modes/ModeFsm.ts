export abstract class ModeState<T> {
  fsm: ModeFsm;
  constructor(fsm: ModeFsm) {
    this.fsm = fsm;
  }

  transitionTo(state: string, params?: any) {
    this.fsm.transitionTo(state, params);
  }

  abstract onEnter(params?: T);
  abstract onResize();
  abstract onRender();
  abstract onTick(dt: number);
  abstract onLeave();
}

class ModeFsm {
  current: ModeState<any>;
  registry: Map<string, ModeState<any>>;

  constructor() {
    this.registry = new Map();
  }

  register(stateName: string, state: ModeState<any>) {
    this.registry.set(stateName, state);
  }

  transitionTo(state: string, params?: any) {
    if (!this.registry.has(state)) {
      throw new Error(`State not exist: ${state}`);
    }
    if (this.current) this.current.onLeave();
    this.current = this.registry.get(state);
    this.current.onEnter(params);
  }
}

export default ModeFsm;

export const STATE_FPS = 'STATE_FPS';
export const STATE_TRANSITION = 'STATE_TRANSITION';
export const STATE_TOP_DOWN = 'STATE_TOP_DOWN';
