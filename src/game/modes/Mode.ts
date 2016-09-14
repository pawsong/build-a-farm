import Game from '@buffy/voxel-engine/lib/Game';

abstract class Mode {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abstract onResize();
  abstract onRender();
  abstract onTick(dt: number);
}

export default Mode;
