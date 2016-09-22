import {
  GameObject,
  Model,
} from '@buffy/voxel-engine';

interface CharacterOptions {
  scriptable: boolean;
}

class Character extends GameObject {
  scriptable: boolean;

  constructor(id: string, model: Model, options: CharacterOptions) {
    super(id, model, {
      discreteFire: false,
      fireRate: 100, // ms between firing
      jumpTimer: 25,
      walkMaxSpeed: Number(0.0056) * 2,
    });
    this.scriptable = options.scriptable;
  }
}

export default Character;
