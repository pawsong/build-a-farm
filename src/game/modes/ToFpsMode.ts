import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';

import Game from '@buffy/voxel-engine/lib/Game';
import GameObject from '@buffy/voxel-engine/lib/GameObject';
import TransitionCamera from '@buffy/voxel-engine/lib/cameras/TransitionCamera';
import { lookAt } from '@buffy/voxel-engine/lib/utils/mat4';

import ModeFsm, { ModeState } from './ModeFsm';
import FpsMode from './FpsMode';

import CodeEditor from '../../components/CodeEditor';

const v = vec3.create();
const offset = vec3.fromValues(7, 10, 7);
const up = vec3.fromValues(0, 1, 0);

const toMatrix = mat4.create();

interface Callback {
  (succeeded: boolean): any;
}

interface Params {
  viewMatrix: mat4;
}

const DURATION = 500;

class TransitionMode extends ModeState<Params> {
  game: Game;
  accum: number;
  codeEditor: CodeEditor;
  camera: TransitionCamera;
  fromMatrix: mat4;
  constructor(fsm: ModeFsm, game: Game, codeEditor: CodeEditor) {
    super(fsm);

    this.game = game;
    this.codeEditor = codeEditor;

    this.accum = 0;
    this.camera = new TransitionCamera();
    this.fromMatrix = mat4.create();
  }

  onEnter({ viewMatrix }) {
    mat4.copy(this.fromMatrix, viewMatrix);

    this.accum = 0;
    this.onResize();
  }

  onResize() {
    const { shell } = this.game;
    this.camera.resizeViewport(shell.width, shell.height);
  }

  onRender() {
    const progress = this.accum / DURATION;
    this.codeEditor.setOpacity(1 - progress);

    const { fpsMode } = this.fsm.states;

    fpsMode.camera.update();
    this.camera.update(this.fromMatrix, fpsMode.camera.viewMatrix, progress, progress * this.camera.viewWidth / 4);
    this.game.render(this.camera);
  }

  onTick(dt: number) {
    this.accum += dt;

    if (this.accum > DURATION) {
      this.transitionTo(this.fsm.states.fpsMode);
    }
  }

  onLeave() {
    this.codeEditor.close();
  }
}

export default TransitionMode;
