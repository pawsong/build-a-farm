import Character from './Character';
import MapService from './MapService';

enum HelperBehaviorState {
  IDLE,
  MOVING,
}

class HelperBehavior {
  mapService: MapService;
  player: Character;
  helper: Character;

  stareAtPlayer: boolean;
  state: HelperBehaviorState;

  constructor(mapService: MapService, player: Character, helper: Character) {
    this.mapService = mapService;
    this.player = player;
    this.helper = helper;

    this.helper.on('used', this.handleUsed);

    this.state = HelperBehaviorState.IDLE;
  }

  onTick(dt: number) {
    if (this.state !== HelperBehaviorState.MOVING) this.helper.lookAt(this.player.position);
  }

  onUsed() {

  }

  handleUsed = () => {
    if (this.state !== HelperBehaviorState.IDLE) return;

    const { position } = this.helper;

    const result = this.mapService.searchForNearestVoxel(position, [6]);
    const [voxelId, p0, p1] = result;

    const path = this.mapService.findPath(position, [p0, position[1], p1]);

    this.state = HelperBehaviorState.MOVING;
    this.helper.move(path)
      .then(() => {
        this.state = HelperBehaviorState.IDLE;
        return this.helper.stop();
      })
      .then(() => this.helper.jump());
      // .then(() => {
      //   game.on('tick', dt => helper.lookAt(player.position));
      //   return helper.jump();
      // });
  }
}

export default HelperBehavior;
