import React from 'react';
import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import {
  GameObject,
  Model,
  FpsControlOptions,
} from '@voxeline/engine';
import Game from './Game';

import Behavior from './behaviors/Behavior';

interface CharacterOptions {
  name: string;
  mass?: number;
  gravityMultiplier?: number;
}

export const fpsControlOptions: FpsControlOptions = {
  discreteFire: false,
  fireRate: 100, // ms between firing
  jumpTimer: 25,
  walkMaxSpeed: Number(0.0056) * 2,
};

const defaultBehavior = new Behavior();

class Character extends GameObject {
  name: string;
  behavior: Behavior;

  propsB: Map<string, boolean>;
  propsBT: Map<string, boolean>;
  propsN: Map<string, number>;

  pathStart: vec3;
  pathEnd: vec3;

  constructor(game: Game, id: string, model: Model, options: CharacterOptions) {
    super(game, id, model, {
      control: fpsControlOptions,
      mass: options.mass,
      gravityMultiplier: options.gravityMultiplier,
    });
    this.name = options.name;

    this.propsB = new Map();
    this.propsBT = new Map();
    this.propsN = new Map();

    this.pathStart = vec3.create();
    this.pathEnd = vec3.create();

    this.behavior = defaultBehavior;
    this.on('used', sender => this.behavior.onUsed(sender));
  }

  getPropB(key: string): boolean {
    return !!this.propsB.get(key);
  }

  setPropsB(key: string, val: boolean) {
    this.propsB.set(key, val);
  }

  getPropBT(key: string): boolean {
    return !!this.propsBT.get(key);
  }

  setPropBT(key: string, val: boolean) {
    this.propsBT.set(key, val);
  }

  getPropN(key: string): number {
    return this.propsN.get(key) || 0;
  }

  setPropN(key: string, val: number) {
    this.propsN.set(key, val);
  }

  setBehavior(behavior: Behavior) {
    this.behavior = behavior;
  }

  onTick(dt: number) {
    this.behavior.onTick(dt);
  }
}

interface Character {
  emit(type: 'used', sender: Character): boolean;
  on(type: 'used', listener: (sender: Character) => any): this;

  emit(event: 'message', sender: Character, message: React.ReactNode, callback: Function): boolean;
  on(event: 'message', listener: (sender: Character, message: React.ReactNode, callback: Function) => any): this;

  emit(event: string, ...args: any[]): boolean;
  on(event: string, listener: Function): this;
}

export default Character;
