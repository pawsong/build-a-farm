import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';
const createRay = require('ray-aabb');

import ModeFsm, { ModeState } from './ModeFsm';

// import ModeFsm, {
//   ModeState,
//   STATE_TRANSITION,
// } from './ModeFsm';

import {
  Game,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

import Character, {
  fpsControlOptions,
} from '../Character';

import FpsCamera from '@buffy/voxel-engine/lib/cameras/FpsCamera';
import FpsControl from '@buffy/voxel-engine/lib/controls/FpsControl';

import FpsFocus from '../../components/FpsFocus';
import StatusPanel from '../../components/StatusPanel';

import { RAY_MIN_DIST } from '../constants';

const cp = vec3.create();
const cv = vec3.create();

const v0 = vec3.create();
const v1 = vec3.create();

const focusedVoxel = vec3.create();

const keybindings = {
  'W': 'forward',
  'A': 'left',
  'S': 'backward',
  'D': 'right',
  '<up>': 'forward',
  '<left>': 'left',
  '<down>': 'backward',
  '<right>': 'right',
  '<mouse 1>': 'fire',
  '<mouse 3>': 'firealt',
  '<space>': 'jump',
  '<shift>': 'crouch',
  '<control>': 'alt',
  '<tab>': 'sprint',
};

class FpsMode extends ModeState<void> {
  game: Game;

  camera: FpsCamera;
  ray: any;
  controls: FpsControl;

  fpsFocus: FpsFocus;
  statusPanel: StatusPanel;
  focusedObject: Character;

  player: Character;

  constructor(fsm: ModeFsm, game: Game, player: Character, fpsFocus: FpsFocus, statusPanel: StatusPanel) {
    super(fsm);

    this.game = game;
    this.player = player;

    const { shell } = game;

    this.ray = createRay([0, 0, 0], [0, 0, 1]);
    this.camera = new FpsCamera(player);

    this.fpsFocus = fpsFocus;
    this.statusPanel = statusPanel;
    this.focusedObject = null;

    // cleanup key name - based on https://github.com/mikolalysenko/game-shell/blob/master/shell.js
    const filtered_vkey = function(k) {
      if(k.charAt(0) === '<' && k.charAt(k.length-1) === '>') {
        k = k.substring(1, k.length-1)
      }
      k = k.replace(/\s/g, "-")
      return k
    }

    // initial keybindings passed in from options
    for (const key in keybindings) {
      const name = keybindings[key]

      // translate name for game-shell
      shell.bind(name, filtered_vkey(key))
    }

    const buttons = {};

    Object.keys(shell.bindings).forEach(name => {
      Object.defineProperty(buttons, name, {
        get: () => shell.pointerLock && shell.wasDown(name),
      })
    })

    this.controls = new FpsControl(buttons, shell, fpsControlOptions);
    this.controls.target(player.physics, player, this.camera.camera);
  }

  onEnter() {
    const { shell } = this.game;
    shell.pointerLock = true;
    shell.stickyPointerLock = true;

    this.onResize();

    this.focusedObject = null;
    this.fpsFocus.setVisible(false);
    this.statusPanel.show();

    window.addEventListener('mousedown', this.handleMouseDown);
  }

  handleMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      if (this.focusedObject) {
        this.handleUse(this.focusedObject);
        this.focusedObject.emit('used', this.player);
      }
    }
  }

  handleUse(target: Character) {
    if (target.scriptable) {
      this.transitionTo(this.fsm.states.transitionMode, {
        target,
        viewMatrix: this.camera.viewMatrix,
      });
    }
  };

  onResize() {
    const { shell } = this.game;
    this.camera.resizeViewport(shell.width, shell.height);
  }

  onRender() {
    this.camera.update();

    this.camera.getPosition(cp);
    this.camera.getVector(cv);

    this.ray.update(cp, cv);

    let minDist = RAY_MIN_DIST * RAY_MIN_DIST;
    let focusedObject: Character = null;

    for (const object of this.game.objects) {
      if (object === this.player) continue;

      const distance = vec3.squaredDistance(object.position, cp);
      if (distance > minDist) continue;

      const result = this.ray.intersects([
        object.physics.aabb.base,
        object.physics.aabb.max,
      ]);

      if (result) {
        minDist = distance;
        focusedObject = <Character> object;
      }
    }

    if (this.focusedObject !== focusedObject) {
      this.focusedObject = focusedObject;
      if (this.focusedObject) {
        this.fpsFocus.setVisible(true);
        this.fpsFocus.setName(this.focusedObject.name);
      } else {
        this.fpsFocus.setVisible(false);
      }
    }

    if (this.focusedObject) {
      this.game.focusedVoxel = null;
    } else {
      const result = this.game.raycastVoxels(cp, cv, RAY_MIN_DIST, v0, v1);
      if (result === 0) {
        this.game.focusedVoxel = null;
      } else {
        focusedVoxel[0] = v0[0] - v1[0] / 2;
        focusedVoxel[1] = v0[1] - v1[1] / 2;
        focusedVoxel[2] = v0[2] - v1[2] / 2;
        this.game.focusedVoxel = vec3.floor(focusedVoxel, focusedVoxel);
      }
    }

    this.game.render(this.camera);
  }

  onTick(dt: number) {
    this.controls.tick(dt);
  }

  onLeave() {
    this.fpsFocus.setVisible(false);
    this.statusPanel.hide();
    window.removeEventListener('mousedown', this.handleMouseDown);
  }
}

export default FpsMode;
