import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';
import JSZip from 'jszip';

import FpsMode from './modes/FpsMode';
import TransitionMode from './modes/TransitionMode';
import TopDownMode from './modes/TopDownMode';
import ToFpsMode from './modes/ToFpsMode';
import ModeFsm, {
  STATE_FPS,
  STATE_TRANSITION,
  STATE_TOP_DOWN,
  STATE_TO_FPS,
} from './modes/ModeFsm';

import PF from 'pathfinding';

const v0 = vec3.create();
const v1 = vec3.create();

const cp = vec3.create();
const cv = vec3.create();

const createRay = require('ray-aabb');

import Stats from 'stats.js';
import axios from 'axios';
import pako from 'pako';
const msgpack = require('msgpack-lite');
const cwise = require('cwise');

import Promise from 'bluebird';

import ndarray from 'ndarray';
const ops = require('ndarray-ops');

import {
  searchForNearestVoxel1,
  searchForNearestVoxel7,
} from './ndops/searchForNearestVoxel';

import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
} from '@buffy/voxel-engine';
import FpsCamera from '@buffy/voxel-engine/lib/cameras/FpsCamera';
import TransitionCamera from '@buffy/voxel-engine/lib/cameras/TransitionCamera';
import FpsControl from '@buffy/voxel-engine/lib/controls/FpsControl';
import { lookAt } from '@buffy/voxel-engine/lib/utils/mat4';

import CodeEditor from '../components/CodeEditor';

const map: string = require('file!./models/map.msgpack');
// const map: string = require('file!./models/map.msgpack');
const hero: string = require('file!./models/cube.msgpack');
const drop: string = require('file!./models/drop.msgpack');
const sprout: string = require('file!./models/sprout.msgpack');

const resourceUrl = require('file!./textures/GoodMorningCraftv4.95.zip');

import VirtualMachine from '../vm/VirtualMachine';

import { RAY_MIN_DIST } from './constants';

const CHUNK_SIZE = 32;
const CHUNK_PAD = 4;
const CHUNK_PAD_HALF = CHUNK_PAD >> 1;
const CHUNK_SHAPE = [
  CHUNK_SIZE + CHUNK_PAD,
  CHUNK_SIZE + CHUNK_PAD,
  CHUNK_SIZE + CHUNK_PAD,
];
const CHUNK_ARRAY_SIZE = CHUNK_SHAPE[0] * CHUNK_SHAPE[1] * CHUNK_SHAPE[2];

// Stats
const stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const OPAQUE_BIT = (1<<15);

function fetchObjectModel(url) {
  return axios.get(url, { responseType: 'arraybuffer' })
    .then(response => {
      const decoded = msgpack.decode(new Uint8Array(response.data as ArrayBuffer));
      const palette = new Uint32Array(decoded.palette);
      const inflated = pako.inflate(new Uint8Array(decoded.buffer));
      const matrix = ndarray(new Uint16Array(inflated.buffer), decoded.shape, decoded.stride, decoded.offset);
      return { matrix, palette };
    });
}

function fetchChunks(url) {
  return axios.get(url, { responseType: 'arraybuffer' })
    .then(response => {
      const decoded = msgpack.decode(new Uint8Array(response.data as ArrayBuffer));

      return decoded.map(item => {
        const matrix = ndarray(new Uint16Array(CHUNK_ARRAY_SIZE), CHUNK_SHAPE);

        const inflated = pako.inflate(new Uint8Array(item.buffer));

        const src = ndarray(new Uint16Array(inflated.buffer), item.shape, item.stride, item.offset);
        const dest = matrix
          .lo(CHUNK_PAD_HALF, CHUNK_PAD_HALF, CHUNK_PAD_HALF)
          .hi(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);

        ops.assign(dest, src);

        return {
          position: item.position,
          matrix,
        }
      });
    });
}

function fetchTexturePack(url) {
  return axios.get(url, { responseType: 'arraybuffer' })
    .then(response => {
      const zip = new JSZip();
      return zip.loadAsync(response.data);
    })
    .then(zip => {
      const promises = [];
      const files = {};
      zip.forEach((relativePath, file) => {
        promises.push(file.async('arraybuffer').then(data => files[relativePath] = data));
      });
      return Promise.all(promises).then(() => files);
    });
}

interface Block {
  id: number;
  name: string;
  texture: string | string[];
  hardness: number;
  blockModel: any;
}

var BLOCKS: any[] = [
  {
    id: 1,
    name: 'transparent_wall',
    // texture: 'air',
    hardness: Infinity,
    // transparent: true,
  },
  {
    id: 2,
    name: 'bedrock',
    texture: 'bedrock',
    hardness: Infinity,
  },
  {
    id: 3,
    name: 'grass',
    texture: ['grass_top', 'dirt', 'grass_side'],
    hardness: Infinity,
  },
  {
    id: 4,
    name: 'logOak',
    texture: ['log_oak_top', 'log_oak_top', 'log_oak'],
    hardness: Infinity,
  },
  {
    id: 5,
    name: 'sand',
    texture: 'sand',
    hardness: Infinity,
  },
  {
    id: 6,
    name: 'hardened_clay_stained_light_blue',
    texture: 'hardened_clay_stained_light_blue',
    hardness: Infinity,
  },
  {
    id: 7,
    name: 'farmland_dry',
    texture: 'farmland_dry',
    hardness: Infinity,
  },
  {
    id: 8,
    name: 'wheat_stage_0',
    texture: 'wheat_stage_0',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_0',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 9,
    name: 'wheat_stage_1',
    texture: 'wheat_stage_1',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_1',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 10,
    name: 'wheat_stage_2',
    texture: 'wheat_stage_2',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_2',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 11,
    name: 'wheat_stage_3',
    texture: 'wheat_stage_3',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_3',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 12,
    name: 'wheat_stage_4',
    texture: 'wheat_stage_4',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_4',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 13,
    name: 'wheat_stage_5',
    texture: 'wheat_stage_5',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_5',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 14,
    name: 'wheat_stage_6',
    texture: 'wheat_stage_6',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_6',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 15,
    name: 'wheat_stage_7',
    texture: 'wheat_stage_7',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'wheat_stage_7',
      },
    ],
    hardness: Infinity,
  },
  {
    id: 16,
    name: 'flower_tulip_orange',
    texture: 'flower_tulip_orange',
    blockModel: [
      {
        from: [0, 0, 0],
        to: [16, 16, 16],
        faceData: {
          north: {},
          south: {},
          west: {},
          east: {}
        },
        texture: 'flower_tulip_orange',
      },
    ],
    hardness: Infinity,
  },
];

const count = cwise({
  args: ['array', 'scalar'],
  pre: function () {
    this.count = 0;
  },
  body: function(val, voxelId) {
    if (val === voxelId) {
      this.count++;
    }
  },
  post: function () {
    return this.count;
  }
});

interface MainOptions {
  container: HTMLElement;
  codeEditor: CodeEditor;
  vm: VirtualMachine;
}

function main ({
  container,
  codeEditor,
  vm,
}: MainOptions) {
  Promise.all([
    Game.initShell(),
    fetchChunks(map),
    fetchObjectModel(hero),
    fetchObjectModel(drop),
    fetchTexturePack(resourceUrl),
  ]).then(([shell, chunks, {matrix, palette}, dropData, pack]) => {
    shell.on('gl-render', () => stats.update());

    const size = chunks.reduce((prev, chunk) => {
      return [
        Math.max(chunk.position[0] + 1, prev[0]),
        Math.max(chunk.position[1] + 1, prev[1]),
        Math.max(chunk.position[2] + 1, prev[2]),
      ];
    }, [0, 0, 0]);

    const ground = ndarray(new Uint32Array(CHUNK_SIZE * size[0] * 1 * CHUNK_SIZE * size[2]), [
      CHUNK_SIZE * size[0], 1, CHUNK_SIZE * size[2],
    ]);

    for (const chunk of chunks) {
      const src = chunk.matrix
        .lo(CHUNK_PAD_HALF, CHUNK_PAD_HALF, CHUNK_PAD_HALF)
        .hi(CHUNK_SIZE, 1, CHUNK_SIZE);

      const dest = ground
        .lo(chunk.position[0] * CHUNK_SIZE, 0, chunk.position[2] * CHUNK_SIZE)
        .hi(CHUNK_SIZE, 1, CHUNK_SIZE);

      ops.assign(dest, src);
    }

    const grid = new PF.Grid(ground.shape[0], ground.shape[2]);
    for (let x = 0; x < ground.shape[0]; ++x) {
      for (let z = 0; z < ground.shape[2]; ++z) {
        if (ground.get(x, 0, z) === 6) grid.setWalkableAt(x, z, false);
      }
    }

    const cache: { [index: string]: any } = {};

    chunks.forEach(chunk => {
      const { matrix, position } = chunk;
      matrix.position = position;

      const key = position.join('|');
      cache[key] = chunk.matrix;
    });

    const game = new Game(shell, {
      artpacks: [pack],
      blocks: BLOCKS,
      player: {
        id: '0',
        matrix,
        palette,
      },
      fpsControlOptions: {
        discreteFire: false,
        fireRate: 100, // ms between firing
        jumpTimer: 25,
        walkMaxSpeed: Number(0.0056) * 2,
      },
      pluginOpts: {
        'voxel-engine-stackgl': {
          generateChunks: false,
        },
      },
    });

    function findWalkableAdjacent(x: number, z: number) {
      if (ground.get(x, 0, z) !== 6) return [x, z];

      let minDist = Infinity;
      let ret;

      for (const point of [
        [x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z],
      ]) {
        const val = ground.get(point[0], 0, point[1]);

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

    function setBlock(x: number, y: number, z: number, blockId: number) {
      game.setBlock(x, y, z, blockId);
      ground.set(x, 0, z, blockId);
    }

    game.stitcher.once('addedAll', () => {
      const waterdrop = game.addItem('waterdrop', dropData.matrix, dropData.palette);

      function handleUseVoxel(gameObject: GameObject, x: number, y: number, z: number) {
        const voxelId = game.getVoxel(x, y, z);

        switch(voxelId) {
          case 6: {
            gameObject.holdItem(waterdrop);
            break;
          }
          case 7: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y + 1, z, 8);
              gameObject.throwItem();
            }
            break;
          }
          case 8: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 9);
              gameObject.throwItem();
            }
            break;
          }
          case 9: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 10);
              gameObject.throwItem();
            }
            break;
          }
          case 10: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 11);
              gameObject.throwItem();
            }
            break;
          }
          case 11: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 12);
              gameObject.throwItem();
            }
            break;
          }
          case 12: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 13);
              gameObject.throwItem();
            }
            break;
          }
          case 13: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 14);
              gameObject.throwItem();
            }
            break;
          }
          case 14: {
            if (gameObject.item === waterdrop) {
              setBlock(x, y, z, 15);
              gameObject.throwItem();
            }
            break;
          }
        }
      }

      const startTopDownMode = (target: GameObject) => {

      };

      const a = game.addObject({
        id: 'a',
        matrix,
        palette,
      });
      a.avatar.setPosition(7, 10, 33);
      a.avatar.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      a.avatar.lookAt(vec3.fromValues(8, 10, 33));

      const b = game.addObject({
        id: 'b',
        matrix,
        palette,
      });
      b.avatar.setPosition(9, 7, 30);
      b.avatar.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      b.avatar.lookAt(vec3.fromValues(10, 7, 30));

      const c = game.addObject({
        id: 'c',
        matrix,
        palette,
      });
      c.avatar.setPosition(11, 12, 36);
      c.avatar.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      c.avatar.lookAt(vec3.fromValues(12, 12, 36));

      const player = game.getObject('0');
      player.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      player.setPosition(35, 2, 61);
      // player.setPosition(0, 4, 0);
      player.lookAt(vec3.set(v0, 34, 2, 61));

      player.on('appear', () => console.log('good!'));

      const blocks = [
        game.registry.getBlockIndex(1),
        game.registry.getBlockIndex(2),
        game.registry.getBlockIndex(3),
        game.registry.getBlockIndex(4),
        game.registry.getBlockIndex(5),
        game.registry.getBlockIndex(6),
      ];

      let idx = 0;

      // Draw terrain

      function isChunkAvailable(position) {
        return position[1] === -1 || position[1] === 0;
      }

      function getChunk(position) {
        const blockIndex = blocks[ 5 ];

        const width = game.chunkSize;
        const pad = game.chunkPad;
        const arrayType = game.arrayType;

        const buffer = new ArrayBuffer((width+pad) * (width+pad) * (width+pad) * arrayType.BYTES_PER_ELEMENT);
        const voxelsPadded = ndarray(new arrayType(buffer), [width+pad, width+pad, width+pad]);
        const h = pad >> 1;
        const voxels = voxelsPadded.lo(h,h,h).hi(width,width,width);

        if (position[1] !== 0) {
          for (let x = 0; x < game.chunkSize; ++x) {
            for (let z = 0; z < game.chunkSize; ++z) {
              for (let y = 0; y < game.chunkSize; ++y) {
                voxels.set(x, y, z, blockIndex);
              }
            }
          }
        }

        const chunk = voxelsPadded;
        chunk['position'] = position;

        return chunk;
      }

      function getCachedChunk(position) {
        const key = position.join('|');

        const cached = cache[key];
        if (cached) return cached;

        return cache[key] = getChunk(position);
      }

      game.voxels.on('missingChunk', position => {
        if (!isChunkAvailable(position)) return;
        game.showChunk(getCachedChunk(position));
      });

      const finder = new PF.AStarFinder();

      vm.on('message', (message) => {
        const object = game.getObject(message.objectId);

        switch(message.type) {
          case 'getNearestVoxels': {
            const { params: vids } = message;
            const { position } = object;

            switch(vids.length) {
              case 1: {
                const result = searchForNearestVoxel1(ground, position[0], position[2], vids[0]);
                if (!result) break;

                const [voxelId, p0, p1] = result;
                vm.sendResponse(message.objectId, message.requestId, [
                  p0, [8, 9, 10, 11, 12, 13, 14, 15].indexOf(voxelId) === -1 ? 0 : 1, p1,
                ]);
                break;
              }
              case 7: {
                const result = searchForNearestVoxel7(ground, position[0], position[2],
                  vids[0], vids[1], vids[2], vids[3], vids[4], vids[5], vids[6]
                );
                if (!result) break;

                const [voxelId, p0, p1] = result;
                vm.sendResponse(message.objectId, message.requestId, [
                  p0, [8, 9, 10, 11, 12, 13, 14, 15].indexOf(voxelId) === -1 ? 0 : 1, p1,
                ]);
                break;
              }
            }
            break;
          }
          case 'moveTo': {
            const { params } = message;
            const { position } = object;

            const point = findWalkableAdjacent(params[0], params[2]);

            const path = finder.findPath(
              Math.round(position[0]), Math.round(position[2]),
              point[0], point[1],
              grid.clone()
            );

            const pathLastIndex = path.length - 1;
            const finalPath = path.map((point, index) => [point[0], 1, point[1]]);
            finalPath.push(params);

            object.move(finalPath).then(() => {
              vm.sendResponse(message.objectId, message.requestId);
            });
            break;
          }
          case 'use': {
            const { lastReq } = message;
            if (lastReq && lastReq.type === 'moveTo') {
              const position = lastReq.params;
              handleUseVoxel(object, position[0], position[1], position[2]);
            } else {
              vec3.copy(cp, object.position);
              cp[1] += 1;

              const result = game.raycastVoxels(cp, object.getDirection(cv), RAY_MIN_DIST, v0, v1);

              if (result !== 0) {
                handleUseVoxel(object,
                  Math.round(v0[0] - v1[0]),
                  Math.round(v0[1] - v1[1]),
                  Math.round(v0[2] - v1[2])
                );
              }
            }
            vm.sendResponse(message.objectId, message.requestId);
            break;
          }
        }
      });

      // Rendering

      const fsm = new ModeFsm();
      const fpsMode = new FpsMode(fsm, game, player);
      fsm.register(STATE_FPS, fpsMode);
      fsm.register(STATE_TRANSITION, new TransitionMode(fsm, game, codeEditor));
      fsm.register(STATE_TOP_DOWN, new TopDownMode(fsm, game));
      fsm.register(STATE_TO_FPS, new ToFpsMode(fsm, game, codeEditor, fpsMode));
      fsm.transitionTo(STATE_FPS);

      shell.on('gl-resize', () => fsm.current.onResize());
      shell.on('gl-render', () => fsm.current.onRender());
      game.on('tick', dt => fsm.current.onTick(dt));
      game.on('useVoxel', (position: vec3) => handleUseVoxel(player, position[0], position[1], position[2]));
    });
  });
}

export default main;
