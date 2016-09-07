import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';

const v0 = vec3.create();
const v1 = vec3.create();

const cp = vec3.create();
const cv = vec3.create();

const createRay = require('ray-aabb');

import Stats from 'stats.js';
import axios from 'axios';
import pako from 'pako';
const msgpack = require('msgpack-lite');

import Promise from 'bluebird';

const ndarray = require('ndarray');
const ops = require('ndarray-ops');

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

const frame = require('file!./models/frame.msgpack');
const hero = require('file!./models/cube.msgpack');

const resourceUrl = require('file!./textures/GoodMorningCraftv4.95.zip');

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

interface Block {
  id: number;
  name: string;
  texture: string | string[];
  hardness: number;
}

var BLOCKS: Block[] = [
  {
    id: 1,
    name: 'logOak',
    texture: ['log_oak_top', 'log_oak_top', 'log_oak'],
    hardness: Infinity,
  },
  // {
  //   id: 1,
  //   name: 'brick',
  //   texture: 'brick',
  //   hardness: Infinity,
  // },
  {
    id: 2,
    name: 'bedrock',
    texture: 'bedrock',
    hardness: Infinity,
  },
  {
    id: 3,
    name: 'nether_brick',
    texture: 'nether_brick',
    hardness: Infinity,
  },
  {
    id: 4,
    name: 'obsidian',
    texture: 'obsidian',
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
    name: 'grass',
    texture: ['grass_top', 'dirt', 'grass_side'],
    hardness: Infinity,
  },
  {
    id: 7,
    name: 'wheat_stage_7',
    texture: 'wheat_stage_7',
    hardness: Infinity,
  },
];

interface MainOptions {
  container: HTMLElement;
  codeEditor: CodeEditor;
}

function main ({
  container,
  codeEditor,
}: MainOptions) {
  Promise.all([
    fetchChunks(frame),
    fetchObjectModel(hero),
    Game.initShell(),
  ]).then(([chunks, {matrix, palette}, shell]) => {
    shell.on('gl-render', () => {
      stats.update();
    });

    let camera: Camera = null;

    const cache: { [index: string]: any } = {};

    chunks.forEach(chunk => {
      const { matrix, position } = chunk;
      matrix.position = position;

      const key = position.join('|');
      cache[key] = chunk.matrix;
    });

    const game = new Game(shell, {
      artpacks: [resourceUrl],
      blocks: BLOCKS,
      player: {
        id: '0',
        matrix,
        palette,
      },
      onUse: (object) => {
        shell.pointerLock = false;
        shell.stickyPointerLock = false;

        codeEditor.setOpacity(0);
        codeEditor.open();

        // Transition for 700 ms

        // TODO: Disable controls

        const fromMatrix = mat4.clone(camera.viewMatrix);
        const toMatrix = mat4.create();

        const v = vec3.create();
        const offset = vec3.fromValues(7, 10, 7);
        const up = vec3.fromValues(0, 1, 0);

        // game.camera.
        const transitionCamera = new TransitionCamera();
        transitionCamera.resizeViewport(shell.width, shell.height);

        camera = transitionCamera;

        let accum = 0;

        let lt = performance.now();

        const handlePrerender = () => {
          const now = performance.now();
          const dt = now - lt;
          lt = now;

          accum += dt;
          const progress = Math.min(accum / 500, 1);
          codeEditor.setOpacity(progress);

          if (progress === 1) {
            shell.removeListener('gl-render', handlePrerender);
            startTopDownMode(object);
            return;
          }

          vec3.add(v, object.position, offset);
          mat4.fromTranslation(toMatrix, v);
          lookAt(toMatrix, v, object.position, up);
          mat4.invert(toMatrix, toMatrix);

          transitionCamera.update(fromMatrix, toMatrix, progress, progress * transitionCamera.viewWidth / 4);
        };
        shell.on('gl-render', handlePrerender);

        handlePrerender();
      },
      pluginOpts: {
        'voxel-engine-stackgl': {
          generateChunks: false,
        },
      },
      // chunkSize: 16,
    });

    const startTopDownMode = (target: GameObject) => {
      shell.removeListener('gl-render', fpsRender);

      const topDownCamera = new TopDownCamera(target, 1 / 4);
      topDownCamera.resizeViewport(shell.width, shell.height);

      camera = topDownCamera;

      shell.on('gl-render', () => {
        topDownCamera.update();
        game.render(topDownCamera);
      });
    };

    const a = game.addObject({
      id: 'a',
      matrix,
      palette,
    });
    a.avatar.setPosition(6, 10, 2);
    a.avatar.setScale(1 / 16, 1 / 16, 1 / 16);

    const b = game.addObject({
      id: 'b',
      matrix,
      palette,
    });
    b.avatar.setPosition(3, 7, 3);
    b.avatar.setScale(1 / 16, 1 / 16, 1 / 16);
    b.avatar.lookAt(vec3.fromValues(3, 7, 100));

    const c = game.addObject({
      id: 'c',
      matrix,
      palette,
    });
    c.avatar.setPosition(4, 12, 7);
    c.avatar.setScale(1 / 16, 1 / 16, 1 / 16);
    c.avatar.lookAt(vec3.fromValues(4, 14, 100));

    const player = game.getObject('0');
    player.setScale(1 / 16, 1 / 16, 1 / 16);

    player.on('appear', () => {
      console.log('good!');
    });

    const obj = game.getObject('c');
    obj.on('appear', (object: GameObject) => {
      if (player === object) {
        obj.lookAt(object.position);
      }
    });

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

      if (position[1] === 0) {
        for (let x = 0; x < game.chunkSize; ++x) {
          voxels.set(x, 0, 0, 7);
        }
      } else {
        for (let x = 0; x < game.chunkSize; ++x) {
          for (let z = 0; z < game.chunkSize; ++z) {
            for (let y = 0; y < game.chunkSize; ++y) {
              voxels.set(x, y, z, blockIndex);
            }
          }
        }
      }

      const chunk = voxelsPadded;
      chunk.position = position;

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
      console.log(position);
      game.showChunk(getCachedChunk(position));
    });

    // Rendering

    const fpsCamera = new FpsCamera(player);
    fpsCamera.resizeViewport(shell.width, shell.height);

    camera = fpsCamera;

    const ray = createRay([0, 0, 0], [0, 0, 1]);

    shell.on('gl-resize', () => {
      camera.resizeViewport(shell.width, shell.height);
    });

    function fpsRender() {
      fpsCamera.update();

      fpsCamera.getPosition(cp);
      fpsCamera.getVector(cv);

      ray.update(cp, cv);

      let minDist = 10 * 10;
      let focusedObject = null;

      for (const object of game.objects) {
        if (object === game.target) continue;

        const distance = vec3.squaredDistance(object.position, cp);
        if (distance > minDist) continue;

        object.getAABB(v0, v1);

        const result = ray.intersects([v0, v1]);
        if (result) {
          minDist = distance;
          focusedObject = object;
        }
      }

      game.focusedObject = focusedObject;
      game.render(camera);
    }

    shell.on('gl-render', fpsRender);

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

    const controls = new FpsControl(buttons, shell, {
      discreteFire: false,
      fireRate: 100, // ms between firing
      jumpTimer: 25,
      walkMaxSpeed: Number(0.0056) * 2,
    });
    controls.target(player.physics, player, fpsCamera.camera);

    game.on('tick', dt => {
      controls.tick(dt);
    });
  });
}

export default main;
