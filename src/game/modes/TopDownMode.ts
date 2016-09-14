import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

import ModeFsm, {
  ModeState,
} from './ModeFsm';

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

  }
}

export default TopDownMode;
