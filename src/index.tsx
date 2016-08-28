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

import Game from '@buffy/voxel-engine';

const game = new Game({
  pluginOpts: {
    'voxel-engine-stackgl': {
      generateChunks: false,
      controls: {
        discreteFire: false,
        fireRate: 100, // ms between firing
        jumpTimer: 25,
      },
    },
    'game-shell-fps-camera': {position: [0, -100, 0]},
  },
});

// Register blocks
game.registry.registerBlock('bedrock', {
  texture: 'bedrock', hardness: Infinity,
});

// Draw terrain
game.voxels.on('missingChunk', (position) => {
  console.log('missingChunk',position);

  if (position[1] > 0) return; // everything above y=0 is air

  var blockIndex = game.registry.getBlockIndex('bedrock');
  if (!blockIndex) {
    throw new Error('voxel-flatland unable to find block of name: ' + 'bedrock');
  };

  var width = game.chunkSize;
  var pad = game.chunkPad;
  var arrayType = game.arrayType;

  var buffer = new ArrayBuffer((width+pad) * (width+pad) * (width+pad) * arrayType.BYTES_PER_ELEMENT);
  var voxelsPadded = ndarray(new arrayType(buffer), [width+pad, width+pad, width+pad]);
  var h = pad >> 1;
  var voxels = voxelsPadded.lo(h,h,h).hi(width,width,width);

  for (var x = 0; x < game.chunkSize; ++x) {
    for (var z = 0; z < game.chunkSize; ++z) {
      for (var y = 0; y < game.chunkSize; ++y) {
        voxels.set(x,y,z, blockIndex);
      }
    }
  }

  var chunk = voxelsPadded;
  chunk.position = position;

  console.log('about to showChunk',chunk);
  game.showChunk(chunk);
});
