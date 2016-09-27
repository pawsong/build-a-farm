import React from 'react';
import Character from './Character';
import MapService from './MapService';

import when_run from '../components/blocks/when_run';

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
    this.step = 0;
  }

  onTick(dt: number) {
    if (this.state !== HelperBehaviorState.MOVING) this.helper.lookAt(this.player.position);
  }

  sendMessageToPlayer(message: React.ReactNode) {
    return new Promise(resolve => this.player.emit('message', this.helper, message, resolve));
  }

  step: number;

  handleUsed = () => {
    if (this.state !== HelperBehaviorState.IDLE) return;

    switch(this.step) {
      case 0: {
        this.goWater().then(() => this.step++);
        break;
      }
      case 1: {
        this.goSprout().then(() => this.step++);
        break;
      }
      case 2: {
        this.orderWheat().then(() => this.step++);
        break;
      }
      case 3: {
        this.goCubie().then(() => this.step++);
        break;
      }
    }
  }

  showClickWaterBlockDirection() {
    return this.helper.jump()
      .then(() => this.sendMessageToPlayer('Click water block.'));
  }

  goWater() {
    return Promise.resolve()
      // .then(() => this.sendMessageToPlayer(<span>Drag {when_run} block.</span>))
      .then(() => this.sendMessageToPlayer('This place is so nice!'))
      .then(() => this.sendMessageToPlayer('Follow me. You can get water here.'))
      .then(() => {
        const { position } = this.helper;

        const result = this.mapService.searchForNearestVoxel(position, [6]);
        const [voxelId, p0, p1] = result;

        const path = this.mapService.findPath(position, [p0, position[1], p1]);

        this.state = HelperBehaviorState.MOVING;
        return this.helper.move(path);
      })
      .then(() => {
        this.state = HelperBehaviorState.IDLE;
        return this.helper.stop();
      })
      .then(() => this.showClickWaterBlockDirection());
  }

  goSprout() {
    return Promise.resolve()
      .then(() => this.sendMessageToPlayer('Now you can grow a sprout'))
      .then(() => {
        const { position } = this.helper;

        const result = this.mapService.searchForNearestVoxel(position, [7]);
        const [voxelId, p0, p1] = result;

        const path = this.mapService.findPath(position, [p0, position[1], p1]);

        this.state = HelperBehaviorState.MOVING;
        return this.helper.move(path);
      })
      .then(() => {
        this.state = HelperBehaviorState.IDLE;
        return this.helper.stop();
      })
      .then(() => this.helper.jump())
      .then(() => this.sendMessageToPlayer('Click dirt block'))
  }

  orderWheat() {
    return Promise.resolve()
      .then(() => this.sendMessageToPlayer(`You can grow the sprout you've just planted by watering`))
      .then(() => this.sendMessageToPlayer(`When all grown up, you can harvest wheat`));
  }

  goCubie() {
    return Promise.resolve()
      .then(() => this.sendMessageToPlayer(`Let's go cubies`))
      .then(() => this.helper.jump())
      .then(() => this.sendMessageToPlayer('Click cubie'));
  }
}

export default HelperBehavior;
