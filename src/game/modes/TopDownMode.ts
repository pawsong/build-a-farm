import Mode from './Mode';
import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

class TopDownMode extends Mode {
  camera: TopDownCamera;

  constructor(game: Game) {
    super(game);
    this.camera = new TopDownCamera(1 / 4);
  }

  start(target: GameObject) {
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
}

export default TopDownMode;
