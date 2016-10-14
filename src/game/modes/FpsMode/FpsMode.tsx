import React from 'react';
import ReactDOM from 'react-dom';

import { EventEmitter } from 'events';

import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';
const createRay = require('ray-aabb');
import createElement from '../../../utils/createElement';

import ModeFsm, { ModeState } from '../ModeFsm';

const createBox = require('geo-3d-box');
const glShader = require('gl-shader');
const GLGeometry = require('gl-geometry');

const tv0 = vec3.create();
const m0 = mat4.create();

import {
  Game,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';

import Character, {
  fpsControlOptions,
} from '../../Character';

import FpsCamera from '@buffy/voxel-engine/lib/cameras/FpsCamera';
import FpsControl from '@buffy/voxel-engine/lib/controls/FpsControl';

import FpsFocus from './FpsFocus';

import { RAY_MIN_DIST } from '../../constants';

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
  focusedObject: Character;

  player: Character;
  emitter: EventEmitter;

  box: any;
  aabbShader: any;

  constructor(fsm: ModeFsm, game: Game, player: Character) {
    super(fsm);

    this.emitter = new EventEmitter();
    this.fpsFocus = ReactDOM.render(<FpsFocus />, createElement()) as FpsFocus;

    this.game = game;
    this.player = player;

    const { shell } = game;

    this.ray = createRay([0, 0, 0], [0, 0, 1]);
    this.camera = new FpsCamera(player);

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

    const box = createBox();
    for (const position of box.positions) {
      position[0] += 0.5;
      position[1] += 0.5;
      position[2] += 0.5;
    }
    this.box = new GLGeometry(this.game.shell.gl)
      .attr('position', box.positions)
      .faces(box.cells);

    this.aabbShader = glShader(this.game.shell.gl,
      require('raw!glslify!../../../shaders/aabb.vert'),
      require('raw!glslify!../../../shaders/aabb.frag')
    );
  }

  on(type: string, handler: Function) {
    this.emitter.on(type, handler);
    return this;
  }

  onEnter() {
    const { shell } = this.game;
    shell.pointerLock = true;
    shell.stickyPointerLock = true;

    this.onResize();

    this.focusedObject = null;
    this.fpsFocus.setVisible(false);

    window.addEventListener('click', this.handleClick);

    this.player.on('code', this.handleCode);
    this.emitter.emit('enter');
  }

  handleClick = (e: MouseEvent) => {
    if (e.button === 0) {
      if (this.focusedObject) {
        this.focusedObject.emit('used', this.player);
      } else if (this.game.focusedVoxel) {
        this.player.emit('usevoxel', this.game.focusedVoxel);
      }
    }
  }

  handleCode = (target: Character) => {
    target.emit('codeready');
    this.transitionTo(this.fsm.states.transitionMode, {
      target,
      viewMatrix: this.camera.viewMatrix,
    });
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
        focusedObject = object as Character;
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

    // Draw aabb
    // TODO: Make this optional
    const { gl } = this.game.shell;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    const { viewMatrix, projectionMatrix } = this.camera;
    this.box.bind(this.aabbShader);
    this.aabbShader.uniforms.uProjection = projectionMatrix;
    this.aabbShader.uniforms.uView = viewMatrix;

    for (const object of this.game.objects) {
      mat4.fromTranslation(m0, object.physics.aabb.base);
      mat4.scale(m0, m0, object.physics.aabb.size);

      this.aabbShader.uniforms.uModel = m0;
      this.box.draw();
    }

    gl.enable(gl.DEPTH_TEST);
  }

  onTick(dt: number) {
    this.controls.tick(dt);
  }

  onLeave() {
    this.fpsFocus.setVisible(false);
    window.removeEventListener('click', this.handleClick);

    this.emitter.emit('leave');
    this.player.removeListener('code', this.handleCode);
  }
}

export default FpsMode;
