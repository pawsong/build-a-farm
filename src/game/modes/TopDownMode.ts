import { EventEmitter } from 'events';

import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

import ModeFsm, { ModeState } from './ModeFsm';
import CodeEditor from '../../components/CodeEditor';

const styles = require('./TopDownMode.css');

interface Params {
  target: GameObject;
}

class TopDownMode extends ModeState<Params> {
  game: Game;
  camera: TopDownCamera;
  emitter: EventEmitter;
  codeEditor: CodeEditor;

  constructor(fsm: ModeFsm, game: Game, codeEditor: CodeEditor) {
    super(fsm);
    this.game = game;
    this.camera = new TopDownCamera(1 / 4);
    this.emitter = new EventEmitter();
    this.codeEditor = codeEditor;
  }

  tryLeave = () => {
    this.transitionTo(this.fsm.states.toFpsMode, {
      viewMatrix: this.camera.viewMatrix,
    });
  }

  on(event: string, handler: Function) {
    this.emitter.on(event, handler);
    return this;
  }

  onEnter({ target }) {
    this.camera.changeTarget(target);
    this.onResize();
    this.emitter.emit('enter');

    this.codeEditor.once('close', this.tryLeave);
  }

  onResize() {
    const { shell } = this.game;
    this.camera.resizeViewport(shell.width, shell.height);
  }

  onRender() {
    this.camera.update();
    this.game.render(this.camera);
  }

  onTick() {

  }

  onLeave() {
    this.codeEditor.removeListener('close', this.tryLeave);
  }
}

export default TopDownMode;
