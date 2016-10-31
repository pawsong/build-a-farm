import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import { Game as GameBase } from '@voxeline/engine';
import { PathFinder, Channel } from '@voxeline/pathfinder';
import GameChunk from './GameChunk';

const RAY_MIN_DIST = 6;
const ny = vec3.fromValues(0, -1, 0);
const pathfinder = new PathFinder();

class Game extends GameBase<GameChunk> {
  findPath(fromPos: vec3, toPos: vec3, fromPosOnMesh: vec3, toPosOnMesh: vec3) {
    const fromNode = this.getNavMeshNode(fromPos, fromPosOnMesh);
    if (!fromNode) {
      console.warn('Cannot find fromNode');
      return null;
    }

    const toNode = this.getNavMeshNode(toPos, toPosOnMesh);
    if (!toNode) {
      console.warn('Cannot find toNode');
      return null;
    }

    const path = pathfinder.findPath(fromNode, toNode);
    if (!path) {
      console.warn('Cannot find path');
      return null;
    }

    const channel = new Channel();
    channel.push(fromPosOnMesh);

    for (let i = path.length - 1; i >= 0; --i) {
      const { portal } = path[i];
      channel.push(portal[0], portal[1]);
    }
    channel.push(toPosOnMesh);

    return channel.stringPull();
  }

  getNavMeshNode(position: vec3, posOnMesh: vec3) {
    const hit = this.raycastSolidVoxels(position, ny, RAY_MIN_DIST, posOnMesh);
    if (!hit) {
      console.warn('raycast missed');
      return null;
    }

    // Get chunk
    const chunk = this.getChunkAtPosition(posOnMesh);
    if (!chunk) {
      console.warn('Cannot find chunk');
      return null;
    }

    // Get node
    const navmesh = chunk.getNavMesh();
    return navmesh.searchNode(posOnMesh);
  }

  getNearestWalkableVoxel(out: vec3, p: vec3, target: vec3) {
    let minSqDist = Infinity;

    minSqDist = this.testNearestWalkable(out, minSqDist, p, target[0] - 1, target[1], target[2]    );
    minSqDist = this.testNearestWalkable(out, minSqDist, p, target[0] + 1, target[1], target[2]    );
    minSqDist = this.testNearestWalkable(out, minSqDist, p, target[0]    , target[1], target[2] - 1);
    minSqDist = this.testNearestWalkable(out, minSqDist, p, target[0]    , target[1], target[2] + 1);

    return minSqDist !== Infinity;
  }

  private testNearestWalkable(out: vec3, minSqDist: number, p: vec3, x: number, y: number, z: number) {
    if (this.isSolidVoxel(this.getVoxel(x, y, z))) y += 1;
    if (this.isSolidVoxel(this.getVoxel(x, y, z))) return minSqDist;

    // Center position
    const cx = x + 0.5;
    const cz = z + 0.5;

    const squaredDistance = (cx - p[0]) * (cx - p[0]) + (cz - p[2]) * (cz - p[2]);
    if (squaredDistance > minSqDist) return minSqDist;

    vec3.set(out, cx, y, cz);
    return squaredDistance;
  }
}

export default Game;
