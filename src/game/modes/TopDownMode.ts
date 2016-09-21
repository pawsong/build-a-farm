import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

import ModeFsm, { ModeState } from './ModeFsm';

interface Params {
  target: GameObject;
}

class TopDownMode extends ModeState<Params> {
  game: Game;
  camera: TopDownCamera;

  constructor(fsm: ModeFsm, game: Game) {
    super(fsm);
    this.game = game;
    this.camera = new TopDownCamera(1 / 4);
  }

  onEnter({ target }) {
    this.camera.changeTarget(target);
    this.onResize();

    document.addEventListener('keydown', this.handleKeydown, false);
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
    document.removeEventListener('keydown', this.handleKeydown, false);
  }

  handleKeydown = (e: KeyboardEvent) => {
    if (e.keyCode !== 27 /* ESC */) return;

    this.transitionTo(this.fsm.states.toFpsMode, {
      viewMatrix: this.camera.viewMatrix,
    });
  }
}

export default TopDownMode;
