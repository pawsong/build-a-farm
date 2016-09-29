import Character from '../Character';
import BaseBehavior from './BaseBehavior';
import { QuestFarmProgress } from './constants';
import CodeEditor from '../../components/CodeEditor';
import Overlay from '../../ui/Overlay';
import TipBalloon from '../../ui/TipBalloon';

import {
  N_QUEST_FARM_PROGRESS,
} from '../props/propsN';

const codeEndError = new Error('code ended');

class WorkerBehavior extends BaseBehavior {
  codeEditor: CodeEditor;
  overlay: Overlay;
  tipBalloon: TipBalloon;
  player: Character;

  constructor(me: Character, player: Character, codeEditor: CodeEditor, overlay: Overlay, tipBalloon: TipBalloon) {
    super(me);

    this.codeEditor = codeEditor;
    this.overlay = overlay;
    this.tipBalloon = tipBalloon;

    this.player = player;

    me.on('codeready', this.handleCodeReady);
    me.on('codebegin', this.handleCodeBegin);
    me.on('codeend', this.handleCodeEnd);
  }

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

  private handleCodeReady = () => {
    switch (this.player.getPropN(N_QUEST_FARM_PROGRESS)) {
      case QuestFarmProgress.WHEAT_FOUND: {
        break;
      }
    }
  }

  private handleCodeBegin = async () => {
    const source = this.player;

    try {
      switch (source.getPropN(N_QUEST_FARM_PROGRESS)) {
        case QuestFarmProgress.WHEAT_FOUND: {
          await this.introduceActionButton(source);
          break;
        }
      }
    } catch(err) {
    }
  }

  private handleCodeEnd = async () => {
    this.overlay.hide();
    this.tipBalloon.hide();
  }

  private p<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const _handleCodeEnd = () => {
        this.me.removeListener('codeend', _handleCodeEnd);
        reject(codeEndError)
      }

      promise
        .then(result => {
          this.me.removeListener('codeend', _handleCodeEnd);
          resolve(result);
        })
        .catch(err => {
          this.me.removeListener('codeend', _handleCodeEnd);
          reject(err);
        });

      this.me.on('codeend', _handleCodeEnd);
    });
  }

  async introduceActionButton(target: Character) {
    this.overlay.show();
    await this.p(this.sendMessage(target, `Let's start teaching!`));

    const { actionButton } = this.codeEditor;
    this.tipBalloon.show(actionButton);

    this.overlay.setHighlighedElements([
      this.tipBalloon.balloon,
      actionButton,
    ]);

    await this.p(new Promise(resolve => this.codeEditor.once('play', resolve)));

    this.overlay.hide();
    this.tipBalloon.hide();

    await this.p(this.sendMessage(target, 'Good job!'));
  }
}

export default WorkerBehavior;
