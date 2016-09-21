import { Fsm, State } from '../../fsm';
import FpsMode from './FpsMode';
import TransitionMode from './TransitionMode';
import TopDownMode from './TopDownMode';
import ToFpsMode from './ToFpsMode';

abstract class ModeState<T> extends State<T, ModeFsm> {
  abstract onResize();
  abstract onRender();
  abstract onTick(dt: number);
}

interface States {
  fpsMode: FpsMode;
  transitionMode: TransitionMode;
  topDownMode: TopDownMode;
  toFpsMode: ToFpsMode;
}

class ModeFsm extends Fsm {
  states: States;
  current: ModeState<any>;

  init(states: States, current: ModeState<any>) {
    this.states = states;
    this.current = current;
    this.current.onEnter();
  }
}

export { ModeState }
export default ModeFsm;
