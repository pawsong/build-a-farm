import Character from '../Character';

class Behavior {
  onTick(dt: number): void {}
  onUsed(source: Character): void {}
}

export default Behavior;
