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

import Character from '../Character';

import FpsCamera from '@buffy/voxel-engine/lib/cameras/FpsCamera';
import FpsControl from '@buffy/voxel-engine/lib/controls/FpsControl';

import { RAY_MIN_DIST } from '../constants';

const cp = vec3.create();
const cv = vec3.create();

const v0 = vec3.create();
const v1 = vec3.create();

const focusedVoxel = vec3.create();

class FpsMode extends ModeState<void> {
  game: Game;

  camera: FpsCamera;
  ray: any;
  controls: FpsControl;

  constructor(fsm: ModeFsm, game: Game, player: Character) {
    super(fsm);

    this.game = game;

    const { shell } = game;

    this.ray = createRay([0, 0, 0], [0, 0, 1]);
    this.camera = new FpsCamera(player);

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

    this.controls = new FpsControl(buttons, shell, {
      discreteFire: false,
      fireRate: 100, // ms between firing
      jumpTimer: 25,
      walkMaxSpeed: Number(0.0056) * 2,
    });
    this.controls.target(player.physics, player, this.camera.camera);
  }

  onEnter() {
    const { shell } = this.game;
    shell.pointerLock = true;
    shell.stickyPointerLock = true;

    this.onResize();

    this.game.on('use', this.handleUse);
  }

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
    let focusedObject = null;

    for (const object of this.game.objects) {
      if (object === this.camera.camera.parent) continue;

      const distance = vec3.squaredDistance(object.position, cp);
      if (distance > minDist) continue;

      const result = this.ray.intersects([
        object.physics.aabb.base,
        object.physics.aabb.max,
      ]);

      if (result) {
        minDist = distance;
        focusedObject = object;
      }
    }

    this.game.focusedObject = focusedObject;

    if (focusedObject) {
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
    this.game.removeListener('use', this.handleUse);
  }

  handleUse = (target: Character) => {
    if (target.scriptable) {
      this.transitionTo(this.fsm.states.transitionMode, {
        target,
        viewMatrix: this.camera.viewMatrix,
      });
    }
  };
}

export default FpsMode;
