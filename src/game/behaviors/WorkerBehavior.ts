import Character from '../Character';
import BaseBehavior from './BaseBehavior';
import { QuestFarmProgress } from './constants';

import {
  N_QUEST_FARM_PROGRESS,
} from '../props/propsN';

class WorkerBehavior extends BaseBehavior {
  async onUsed(source: Character) {
    if (!this.lock('used')) return;

    switch (source.getPropN(N_QUEST_FARM_PROGRESS)) {
      case QuestFarmProgress.INIT:
      case QuestFarmProgress.WATER_FOUND:
      case QuestFarmProgress.SPROUT_FOUND:
      {
        await this.greet(source);
        break;
      }
      case QuestFarmProgress.WHEAT_FOUND:
      {
        source.emit('code', this.me);
        break;
      }
    }

    this.unlock('used');
  }

  async greet(target: Character) {
    this.me.lookAt(target.position);
    await this.sendMessage(target, 'Hello! Helper is waiting for you');
  }
}

export default WorkerBehavior;
