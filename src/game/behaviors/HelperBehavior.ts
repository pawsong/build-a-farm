import React from 'react';
import Character from '../Character';
import BaseBehavior from './BaseBehavior';
import MapService from '../MapService';

import {
  N_QUEST_FARM_PROGRESS,
} from '../props/propsN';
import {
  BT_WATER_INTRODUCED,
  BT_SPROUT_INTRODUCED,
} from '../props/propsBT';

import { QuestFarmProgress } from './constants';

class HelperBehavior extends BaseBehavior {
  player: Character;
  mapService: MapService;
  moving: number;

  constructor(me: Character, player: Character, mapService: MapService) {
    super(me);
    this.player = player;
    this.mapService = mapService;
    this.moving = 0;
  }

  onTick(dt: number) {
    if (this.moving <= 0) this.me.lookAt(this.player.position);
  }

  async onUsed(source: Character) {
    if (!this.lock('used')) return;

    switch(source.getPropN(N_QUEST_FARM_PROGRESS)) {
      case QuestFarmProgress.INIT: {
        await this.introduceWater(source);
        break;
      }
      case QuestFarmProgress.WATER_FOUND: {
        await this.introduceSprout(source);
        break;
      }
      case QuestFarmProgress.SPROUT_FOUND: {
        await this.requestWheat(source);
        break;
      }
      case QuestFarmProgress.WHEAT_FOUND: {
        await this.introduceWorker(source);
        break;
      }
    }

    this.unlock('used');
  }

  /**
   * Step 1: introduceWater
   */

  private async introduceWater(target: Character) {
    if (!target.getPropBT(BT_WATER_INTRODUCED)) {
      await this.sendMessage(target, 'This place is so nice!');
      await this.sendMessage(target, 'Follow me. You can get water here.');
      await this.moveTo([6]);
      await this.me.stop();

      this.player.on('getitem', this.listenGetWater);
      target.setPropBT(BT_WATER_INTRODUCED, true);
    }

    await this.me.jump();
    await this.sendMessage(target, 'Click water block.');
  }

  private listenGetWater = (voxelId: number) => {
    if (voxelId !== 6) return;

    this.player.removeListener('getitem', this.listenGetWater);
    this.player.setPropN(N_QUEST_FARM_PROGRESS, QuestFarmProgress.WATER_FOUND);
  }

  /**
   * Step 2: introduceSprout
   */

  private async introduceSprout(target: Character) {
    if (!target.getPropBT(BT_SPROUT_INTRODUCED)) {
      await this.sendMessage(target, 'Now you can grow a sprout');
      await this.moveTo([7]);
      await this.me.stop();

      target.on('usevoxel', this.listenUseWater);
      target.setPropBT(BT_SPROUT_INTRODUCED, true);
    }
    await this.me.jump();
    await this.sendMessage(target, 'Click dirt block');
  }

  private listenUseWater = (voxelId: number) => {
    if (voxelId !== 7) return;

    this.player.removeListener('usevoxel', this.listenUseWater);
    this.player.setPropN(N_QUEST_FARM_PROGRESS, QuestFarmProgress.SPROUT_FOUND);
  }

  /**
   * Step 3: requestWheat
   */

  private async requestWheat(target: Character) {
    if (!target.isListening('getitem', this.listenGetWheat)) {
      target.on('getitem', this.listenGetWheat);
    }
    await this.sendMessage(target, `You can grow the sprout you've just planted by watering`);
    await this.sendMessage(target, `When all grown up, you can harvest wheat`);
  }

  private listenGetWheat = (voxelId: number) => {
    if (voxelId !== 15) return;

    this.player.removeListener('getitem', this.listenGetWheat);
    this.player.setPropN(N_QUEST_FARM_PROGRESS, QuestFarmProgress.WHEAT_FOUND);
  }

  /**
   * Step 4: goCubie
   */
  private async introduceWorker(target: Character) {
    await this.sendMessage(target, `Well done! Now you know how to get a wheat`);
    await this.sendMessage(target, `We need wheat hmm... at least 20`);
    await this.sendMessage(target, `It would be hard to grow the whole wheat on your own`);
    await this.sendMessage(target, `Let me introduce people who can help you`);
  }

  /**
   * Private methods
   */

  private async moveTo(blockIds: number[]) {
    this.moving++;

    const { position } = this.me;

    const result = this.mapService.searchForNearestVoxel(position, blockIds);
    const [voxelId, p0, p1] = result;

    const path = this.mapService.findPath(position, [p0, position[1], p1]);
    await this.me.move(path);

    this.moving--;
  }
}

export default HelperBehavior;
