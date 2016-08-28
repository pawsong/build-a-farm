// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';
// import './index.css';
//
// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );

import Game from '@buffy/voxel-engine';

new Game({
  pluginLoaders: {
    'voxel-bedrock': require('voxel-bedrock'),
    'voxel-flatland': require('voxel-flatland'),
  },
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

    'voxel-bedrock': {},
    'voxel-flatland': {block: 'bedrock'},
  },
});
