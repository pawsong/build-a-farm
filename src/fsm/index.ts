abstract class Fsm {
  current: State<any, Fsm>;

  transitionTo<P>(toState: State<P, Fsm>, enterParams: P) {
    this.current.onLeave();
    this.current = toState;
    this.current.onEnter(enterParams);
  }
}

abstract class State<T, U extends Fsm> {
  fsm: U;

  constructor(fsm: U) {
    this.fsm = fsm;
  }

  abstract onEnter(t?: T);
  abstract onLeave();

  protected transitionTo<P>(toState: State<P, U>, enterParams?: P) {
    return this.fsm.transitionTo(toState, enterParams);
  }
}

export { Fsm, State }
