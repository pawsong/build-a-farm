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

function waitForClick() {
  return new Promise((resolve) => {
    function listener() {
      document.body.removeEventListener('mousedown', listener, true);
      resolve();
    }
    document.body.addEventListener('mousedown', listener, true);
  });
}

function waitWorkspaceChange(workspace: any, checker: (event: any) => boolean) {
  return new Promise(resolve => {
    function listener(event: any) {
      if (checker(event)) {
        resolve();
        workspace.removeChangeListener(listener);
      }
    }
    workspace.addChangeListener(listener);
  });
}

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
      case QuestFarmProgress.ACTION_BUTTON_FOUND:
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
      case QuestFarmProgress.ACTION_BUTTON_FOUND: {
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
        case QuestFarmProgress.ACTION_BUTTON_FOUND: {
          await this.introduceBasicButtons(source);
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
    await this.p(this.sendMessage(target, `Let's start coding!`));

    await this.p(this.sendMessage(target, `This is coding view`));

    await this.p(this.sendMessage(target, `Remember you can always exit this by ESC or EXIT button`));

    const { actionButton } = this.codeEditor;
    this.tipBalloon.show(actionButton, 'Click this button and see what happens!');

    this.overlay.setHighlighedElements([
      actionButton,
    ]);

    await this.p(new Promise(resolve => this.codeEditor.once('play', resolve)));
    target.setPropN(N_QUEST_FARM_PROGRESS, QuestFarmProgress.ACTION_BUTTON_FOUND);

    this.overlay.hide();
    this.tipBalloon.hide();

    await this.p(this.sendMessage(target, 'Good job!'));
  }

  async introduceBasicButtons(target: Character) {
    const { workspace } = this.codeEditor.workspaceWrapper;
    const root = workspace.getTopBlocks()[0];
    const rootSvg = root.getSvgRoot();
    this.tipBalloon.show(rootSvg, 'When run button clicked, this code is executedw');
    this.overlay.show([rootSvg]);

    await this.p(waitForClick());

    const child = workspace.getTopBlocks()[0].getChildren()[0];
    const svg = child.getSvgRoot();
    this.tipBalloon.show(svg, 'You can detach logic and use another one');
    this.overlay.show([svg]);

    await this.p(waitWorkspaceChange(workspace, (e) => {
      return root.getChildren().length === 0;
    }));

    this.tipBalloon.hide();
    this.overlay.hide();

    await this.p(this.sendMessage(target, 'You successfuly detached!'));
    await this.p(this.sendMessage(target, `Let's make robot rotate!`));
  }
}

export default WorkerBehavior;
