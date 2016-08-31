// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';
// import './index.css';
//
// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );

const ndarray = require('ndarray');

// const resourceUrl = require('file!./ProgrammerArt-v3.0-ResourcePack-MC19.zip');
const resourceUrl = require('file!./GoodMorningCraftv4.95.zip');

import Game from '@buffy/voxel-engine';

const game = new Game({
  pluginOpts: {
    'voxel-engine-stackgl': {
      generateChunks: false,
      controls: {
        discreteFire: false,
        fireRate: 100, // ms between firing
        jumpTimer: 25,
        walkMaxSpeed: Number(0.0056) * 2,
      },
    },
    'game-shell-fps-camera': {position: [0, -100, 0]},
    'voxel-stitch': {
      artpacks: [resourceUrl]
    },
  },
  // chunkSize: 16,
});

interface Block {
  id: number;
  name: string;
  texture: string | string[];
  hardness: number;
}

const BLOCKS: Block[] = [
  {
    id: 1,
    name: 'brick',
    texture: 'brick',
    hardness: Infinity,
  },
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
];

for (let block of BLOCKS) {
  game.registry.registerBlock(block);
}

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
  return position[1] === 0 || position[1] === 1;
}

function getChunk(position) {
  const blockIndex = blocks[ (idx++) % blocks.length ];

  const width = game.chunkSize;
  const pad = game.chunkPad;
  const arrayType = game.arrayType;

  const buffer = new ArrayBuffer((width+pad) * (width+pad) * (width+pad) * arrayType.BYTES_PER_ELEMENT);
  const voxelsPadded = ndarray(new arrayType(buffer), [width+pad, width+pad, width+pad]);
  const h = pad >> 1;
  const voxels = voxelsPadded.lo(h,h,h).hi(width,width,width);

  if (position[1] === 0) {
    for (let x = 0; x < game.chunkSize; ++x) {
      for (let z = 0; z < game.chunkSize; ++z) {
        for (let y = 0; y < game.chunkSize; ++y) {
          voxels.set(x, y, z, blockIndex);
        }
      }
    }
  } else {
    for (let x = 0; x < game.chunkSize; ++x) {
      voxels.set(x, 0, 0, blockIndex);
    }
  }

  const chunk = voxelsPadded;
  chunk.position = position;

  return chunk;
}

const cache: { [index: string]: any } = {};

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
