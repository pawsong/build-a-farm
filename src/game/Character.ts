import {
  GameObject,
  Model,
  FpsControlOptions,
} from '@buffy/voxel-engine';

interface CharacterOptions {
  name: string;
  scriptable: boolean;
}

export const fpsControlOptions: FpsControlOptions = {
  discreteFire: false,
  fireRate: 100, // ms between firing
  jumpTimer: 25,
  walkMaxSpeed: Number(0.0056) * 2,
};

class Character extends GameObject {
  scriptable: boolean;
  name: string;

  constructor(id: string, model: Model, options: CharacterOptions) {
    super(id, model, fpsControlOptions);
    this.name = options.name;
    this.scriptable = options.scriptable;
  }
}

interface Character {
  emit(event: 'message', sender: Character, message: string, callback: Function): boolean;
  emit(event: string, ...args: any[]): boolean;
  on(event: 'message', listener: (sender: Character, message: string, callback: Function) => any): this;
  on(event: string, listener: Function): this;
}

export default Character;
