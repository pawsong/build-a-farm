import ndarray from 'ndarray';
import { NavMesher, NavMesh } from '@voxeline/pathfinder';
import Chunk from '@voxeline/engine/lib/Chunk';

const navmesher = new NavMesher();

class GameChunk extends Chunk {
  private navmesh: NavMesh;
  private navmeshNeedsToUpdate: boolean;

  constructor(data: ndarray, p0: number, p1: number, p2: number) {
    super(data, p0, p1, p2);
    this.navmeshNeedsToUpdate = true;
  }

  set(x: number, y: number, z: number, val: number) {
    this.navmeshNeedsToUpdate = true;
    return super.set(x, y, z, val);
  }

  getNavMesh() {
    if (this.navmeshNeedsToUpdate) {
      this.navmesh = navmesher.build(
        navmesher.pad(this.data),
        this.offset[0], this.offset[1], this.offset[2],
      );
      this.navmeshNeedsToUpdate = false;
    }
    return this.navmesh;
  }
}

export default GameChunk;
