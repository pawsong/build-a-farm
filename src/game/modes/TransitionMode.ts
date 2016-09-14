import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';

import Game from '@buffy/voxel-engine/lib/Game';
import GameObject from '@buffy/voxel-engine/lib/GameObject';
import TransitionCamera from '@buffy/voxel-engine/lib/cameras/TransitionCamera';
import { lookAt } from '@buffy/voxel-engine/lib/utils/mat4';

import Mode from './Mode';
import CodeEditor from '../../components/CodeEditor';

const v = vec3.create();
const offset = vec3.fromValues(7, 10, 7);
const up = vec3.fromValues(0, 1, 0);

const toMatrix = mat4.create();

interface Callback {
  (succeeded: boolean): any;
}

class TransitionMode extends Mode {
  lt: number;
  accum: number;
  codeEditor: CodeEditor;
  camera: TransitionCamera;
  target: GameObject;
  fromMatrix: mat4;
  enabled: boolean;

  callback: Callback;

  constructor(game: Game, codeEditor: CodeEditor) {
    super(game);

    this.lt = 0;
    this.accum = 0;
    this.codeEditor = codeEditor;
    this.camera = new TransitionCamera();
    this.fromMatrix = mat4.create();
    this.enabled = false;
  }

  start(target: GameObject, viewMatrix: mat4, callback: Callback) {
    const { shell } = this.game;
    shell.pointerLock = false;
    shell.stickyPointerLock = false;

    this.target = target;
    mat4.copy(this.fromMatrix, viewMatrix);
    this.lt = performance.now();

    this.onResize();
    this.enabled = true;

    this.callback = callback;
  }

  onResize() {
    const { shell } = this.game;
    this.camera.resizeViewport(shell.width, shell.height);
  }

  onRender() {
    if (!this.enabled) return;

    const now = performance.now();
    const dt = now - this.lt;
    this.lt = now;

    this.accum += dt;
    const progress = Math.min(this.accum / 500, 1);
    this.codeEditor.setOpacity(progress);

    if (progress === 1) {
      this.enabled = false;
      this.callback(true);
      return;
    }

    vec3.add(v, this.target.position, offset);
    mat4.fromTranslation(toMatrix, v);
    lookAt(toMatrix, v, this.target.position, up);
    mat4.invert(toMatrix, toMatrix);

    this.camera.update(this.fromMatrix, toMatrix, progress, progress * this.camera.viewWidth / 4);
    this.game.render(this.camera);
  }

  onTick(dt: number) {
    // Do nothing
  }
}

export default TransitionMode;
