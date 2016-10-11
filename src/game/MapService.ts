import ndarray, { Ndarray } from 'ndarray';
import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import PF from 'pathfinding';
import { Game } from '@buffy/voxel-engine';

const ops = require('ndarray-ops');

import {
  searchForNearestVoxel1,
  searchForNearestVoxel7,
} from './ndops/searchForNearestVoxel';

const CHUNK_SIZE = 32;

interface Chunk {
  matrix: Ndarray;
  position: vec3;
}

class MapService {
  game: Game;
  ground: Ndarray;
  grid: PF.Grid;
  finder: PF.AStarFinder;

  constructor(game: Game, chunks: Chunk[]) {
    this.game = game;

    const size = chunks.reduce((prev, chunk) => {
      return [
        Math.max(chunk.position[0] + 1, prev[0]),
        Math.max(chunk.position[1] + 1, prev[1]),
        Math.max(chunk.position[2] + 1, prev[2]),
      ];
    }, [0, 0, 0]);

    this.ground = ndarray(new Uint32Array(CHUNK_SIZE * size[0] * 1 * CHUNK_SIZE * size[2]), [
      CHUNK_SIZE * size[0], 1, CHUNK_SIZE * size[2],
    ]);

    for (const chunk of chunks) {
      const src = chunk.matrix
        .hi(CHUNK_SIZE, 1, CHUNK_SIZE);

      const dest = this.ground
        .lo(chunk.position[0] * CHUNK_SIZE, 0, chunk.position[2] * CHUNK_SIZE)
        .hi(CHUNK_SIZE, 1, CHUNK_SIZE);

      ops.assign(dest, src);
    }

    this.grid = new PF.Grid(this.ground.shape[0], this.ground.shape[2]);
    for (let x = 0; x < this.ground.shape[0]; ++x) {
      for (let z = 0; z < this.ground.shape[2]; ++z) {
        if (this.ground.get(x, 0, z) === 6) this.grid.setWalkableAt(x, z, false);
      }
    }

    this.finder = new PF.AStarFinder();
  }

  findPath(src: vec3, dest: [number, number, number]) {
    const point = this.findWalkableAdjacent(dest[0], dest[2]);

    const path = this.finder.findPath(
      Math.round(src[0]), Math.round(src[2]),
      point[0], point[1],
      this.grid.clone()
    );

    const pathLastIndex = path.length - 1;
    const finalPath = path.map((point, index) => [point[0], src[1], point[1]]);
    finalPath.push([dest[0], dest[1], dest[2]]);

    return finalPath;
  }

  setBlock(x: number, y: number, z: number, blockId: number) {
    this.game.setBlock(x, y, z, blockId);
    this.ground.set(x, 0, z, blockId);
  }

  searchForNearestVoxel(center: vec3, blockIds: number[]) {
    switch(blockIds.length) {
      case 1: {
        return searchForNearestVoxel1(this.ground, center[0], center[2], blockIds[0]);
      }
      case 7: {
        return searchForNearestVoxel7(this.ground, center[0], center[2],
          blockIds[0], blockIds[1], blockIds[2], blockIds[3], blockIds[4], blockIds[5], blockIds[6]
        );
      }
    }

    return null;
  }

  private findWalkableAdjacent(x: number, z: number) {
    if (this.ground.get(x, 0, z) !== 6) return [x, z];

    let minDist = Infinity;
    let ret;

    for (const point of [
      [x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z],
    ]) {
      const val = this.ground.get(point[0], 0, point[1]);

      if (val !== 6) {
        const dx = point[0] - x;
        const dz = point[1] - z;
        const distance = dx * dx + dz * dz;
        if (distance < minDist) {
          minDist = distance;
          ret = point;
        }
      }
    }
    return ret;
  }
}

export default MapService;
