import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';

import Game from '@buffy/voxel-engine/lib/Game';
import GameObject from '@buffy/voxel-engine/lib/GameObject';
import TransitionCamera from '@buffy/voxel-engine/lib/cameras/TransitionCamera';
import { lookAt } from '@buffy/voxel-engine/lib/utils/mat4';

import ModeFsm, { ModeState } from './ModeFsm';

import CodeEditor from '../../components/CodeEditor';

import Character from '../../game/Character';

const v = vec3.create();
const offset = vec3.fromValues(7, 10, 7);
const up = vec3.fromValues(0, 1, 0);

const toMatrix = mat4.create();

interface Params {
  target: Character;
  viewMatrix: mat4;
}

const DURATION = 500;

class TransitionMode extends ModeState<Params> {
  game: Game;
  accum: number;
  codeEditor: CodeEditor;
  camera: TransitionCamera;
  target: Character;
  fromMatrix: mat4;

  constructor(fsm: ModeFsm, game: Game, codeEditor: CodeEditor) {
    super(fsm);

    this.game = game;

    this.accum = 0;
    this.codeEditor = codeEditor;
    this.camera = new TransitionCamera();
    this.fromMatrix = mat4.create();
  }

  onEnter({ target, viewMatrix }: Params) {
    const { shell } = this.game;
    shell.pointerLock = false;
    shell.stickyPointerLock = false;

    this.target = target;
    mat4.copy(this.fromMatrix, viewMatrix);

    this.codeEditor.setOpacity(0);
    this.codeEditor.open(this.target);

    this.accum = 0;
    this.onResize();
  }

  onResize() {
    const { shell } = this.game;
    this.camera.resizeViewport(shell.width, shell.height);
  }

  onRender() {
    const progress = this.accum / DURATION;
    this.codeEditor.setOpacity(progress);

    vec3.add(v, this.target.position, offset);
    mat4.fromTranslation(toMatrix, v);
    lookAt(toMatrix, v, this.target.position, up);
    mat4.invert(toMatrix, toMatrix);

    this.camera.update(this.fromMatrix, toMatrix, progress, progress * this.camera.viewWidth / 4);
    this.game.render(this.camera);
  }

  onTick(dt: number) {
    this.accum += dt;

    if (this.accum > DURATION) {
      this.transitionTo(this.fsm.states.topDownMode, {
        target: this.target,
      });
    }
  }

  onLeave() {
    this.codeEditor.setOpacity(1);
  }
}

export default TransitionMode;
