import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';
import JSZip from 'jszip';

import ModeFsm from './modes/ModeFsm';
import FpsMode from './modes/FpsMode';
import TransitionMode from './modes/TransitionMode';
import TopDownMode from './modes/TopDownMode';
import ToFpsMode from './modes/ToFpsMode';

import Character from './Character';

import MapService from './MapService';

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

import achievements from './achievements';

import HelperBehavior from './HelperBehavior';

import BLOCKS from './blocks';

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

import Overlay from '../components/Overlay';
import CodeEditor from '../components/CodeEditor';
import Notification from '../components/Notification';
import StatusPanel from '../components/StatusPanel';
import FpsFocus from '../components/FpsFocus';
import Dialogue from '../components/Dialogue';
import TipBalloon from '../TipBalloon';

const map: string = require('file!./models/map.msgpack');
const hero: string = require('file!./models/cube.msgpack');
const helperModelUrl: string = require('file!./models/helper.msgpack');
const drop: string = require('file!./models/drop.msgpack');
const sprout: string = require('file!./models/sprout.msgpack');

const resourceUrl = require('file!./textures/GoodMorningCraftv4.95.zip');
const iconExclamationMarkUrl = require('./textures/icon_exclamation_mark.png');
const iconQuestionMarkUrl = require('./textures/icon_question_mark.png');
const iconWheatPlusOne1Url = require('./textures/icon_wheat_plus_one_1.png');
const iconWheatPlusOne2Url = require('./textures/icon_wheat_plus_one_2.png');
const iconWheatPlusOne3Url = require('./textures/icon_wheat_plus_one_3.png');

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

const MARGIN = 20;

function getPoint0(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
  };
}

function getPoint1(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.right,
    y: rect.bottom,
  };
}

// Stats
const stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
stats.dom.style.top = 'inherit';
stats.dom.style.bottom = '0';
document.body.appendChild(stats.dom);

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

function fetchNonBlockTexture(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = (e) => resolve(image);
    image.onerror = (e) => reject(new Error('Image load failed'))
    image.src = url;
  });
}

interface Block {
  id: number;
  name: string;
  texture: string | string[];
  hardness: number;
  blockModel: any;
}

let cropCount = 0;

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
  overlay: Overlay;
  codeEditor: CodeEditor;
  statusPanel: StatusPanel;
  notification: Notification;
  fpsFocus: FpsFocus;
  dialogue: Dialogue;
  tipBalloon: TipBalloon;
  vm: VirtualMachine;
}

function main ({
  container,
  overlay,
  codeEditor,
  statusPanel,
  notification,
  fpsFocus,
  dialogue,
  tipBalloon,
  vm,
}: MainOptions) {
  Promise.all([
    Game.initShell(),
    fetchChunks(map),
    fetchObjectModel(hero),
    fetchObjectModel(helperModelUrl),
    fetchObjectModel(drop),
    fetchTexturePack(resourceUrl),
    fetchNonBlockTexture(iconExclamationMarkUrl),
    fetchNonBlockTexture(iconQuestionMarkUrl),
    fetchNonBlockTexture(iconWheatPlusOne1Url),
    fetchNonBlockTexture(iconWheatPlusOne2Url),
    fetchNonBlockTexture(iconWheatPlusOne3Url),
  ]).then(result => {
    const o = document.createElement('div');
    document.body.appendChild(o);
    o.style.display = 'none';
    o.style.position = 'absolute';
    o.style.top = '0';
    o.style.bottom = '0';
    o.style.left = '0';
    o.style.right = '0';
    o.style.background = 'rgba(0, 0, 0, 0.5)';
    o.style.zIndex = '2000';

    const [
      shell,
      chunks,
      {matrix, palette},
      helperModelData,
      waterDropData,
      pack,
      iconExclamationMarkImage,
      iconQuestionMarkImage,
      iconWheatPlusOne1Image,
      iconWheatPlusOne2Image,
      iconWheatPlusOne3Image,
    ] = <any> result;

    shell.on('gl-render', () => stats.update());

    const cache = new Map();

    chunks.forEach(chunk => {
      const { matrix, position } = chunk;
      matrix.position = position;

      const key = position.join('|');
      cache.set(key, chunk.matrix);
    });

    const game = new Game(shell, {
      artpacks: [pack],
      blocks: BLOCKS,
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

    const cubieModel = game.addModel('cubie', matrix, palette);
    const helperModel = game.addModel('helper', helperModelData.matrix, helperModelData.palette);
    const waterDropModel = game.addModel('waterdrop', waterDropData.matrix, waterDropData.palette);

    const mapService = new MapService(game, chunks);

    game.stitcher.once('addedAll', () => {
      game.stitcher.addNonBlockTexture('icon_exclamation_mark', iconExclamationMarkImage);
      game.stitcher.addNonBlockTexture('icon_question_mark', iconQuestionMarkImage);
      game.stitcher.addNonBlockTexture('icon_wheat_plus_one_1', iconWheatPlusOne1Image);
      game.stitcher.addNonBlockTexture('icon_wheat_plus_one_2', iconWheatPlusOne2Image);
      game.stitcher.addNonBlockTexture('icon_wheat_plus_one_3', iconWheatPlusOne3Image);

      game.stitcher.updateTextureSideID();

      const sprite = game.sprites.register('icon_exclamation_mark', [1, 1], ['icon_exclamation_mark']);
      const sprite2 = game.sprites.register('wheat_plus_one', [3, 1], [
        'icon_wheat_plus_one_1',
        'icon_wheat_plus_one_2',
        'icon_wheat_plus_one_3',
      ], 0.5);

      const waterdrop = game.addItem('waterdrop', waterDropModel);

      const myAchievements = new Set<string>();
      function giveAchievement(id: string) {
        if (myAchievements.has(id)) return;

        const achievment = achievements[id];
        if (!achievment) return;

        myAchievements.add(id);
        notification.show(achievment);
      }

      function handleUseVoxel(gameObject: GameObject, x: number, y: number, z: number) {
        const voxelId = game.getVoxel(x, y, z);

        switch(voxelId) {
          case 6: {
            gameObject.holdItem(waterdrop);

            giveAchievement('GET_WATER');
            break;
          }
          case 7: {
            if (gameObject.item === waterdrop) {
              giveAchievement('GROW_A_SPROUT');
              mapService.setBlock(x, y + 1, z, 8);
              gameObject.throwItem();
            }
            break;
          }
          case 8: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 9);
              gameObject.throwItem();
            }
            break;
          }
          case 9: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 10);
              gameObject.throwItem();
            }
            break;
          }
          case 10: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 11);
              gameObject.throwItem();
            }
            break;
          }
          case 11: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 12);
              gameObject.throwItem();
            }
            break;
          }
          case 12: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 13);
              gameObject.throwItem();
            }
            break;
          }
          case 13: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 14);
              gameObject.throwItem();
            }
            break;
          }
          case 14: {
            if (gameObject.item === waterdrop) {
              mapService.setBlock(x, y, z, 15);
              gameObject.throwItem();
            }
            break;
          }
          case 15: {
            mapService.setBlock(x, y, z, 0);
            game.effectManager.add(x + 0.5, y + 0.5 + 0.5, z + 0.5, sprite2);

            giveAchievement('HARVEST_WHEAT');

            cropCount = cropCount + 1;
            statusPanel.setCropCount(cropCount);
          }
        }
      }

      const helper = new Character('helper', helperModel, {
        name: 'Helper',
        scriptable: false,
      });

      helper.setPosition(20, 2, 38);
      helper.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      // helper.lookAt(vec3.fromValues(8, 2, 33));
      helper.addSprite(sprite);
      // helper.on('appear', () => console.log('good!'));
      game.addObject(helper);

      const a = new Character('a', cubieModel, {
        name: 'Cubie A',
        scriptable: true,
      });
      a.setPosition(7, 2, 33);
      a.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      a.lookAt(vec3.fromValues(8, 2, 33));
      game.addObject(a);

      const b = new Character('b', cubieModel, {
        name: 'Cubie B',
        scriptable: true,
      });
      b.setPosition(9, 7, 30);
      b.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      b.lookAt(vec3.fromValues(10, 7, 30));
      game.addObject(b);

      const c = new Character('c', cubieModel, {
        name: 'Cubie C',
        scriptable: true,
      });
      c.setPosition(11, 4, 36);
      c.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      c.lookAt(vec3.fromValues(12, 4, 36));
      game.addObject(c);

      const player = new Character('player', cubieModel, {
        name: 'Player',
        scriptable: false,
      });
      player.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
      player.setPosition(35, 2, 61);
      // player.setPosition(0, 4, 0);
      player.lookAt(vec3.set(v0, 34, 2, 61));
      game.addObject(player);

      player.on('message', (speaker, message, callback) => {
        dialogue.showMessage(speaker.name, message).then(() => callback());
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

        const cached = cache.get(key);
        if (cached) return cached;

        const chunk = getChunk(position);
        cache.set(key, chunk);
        return chunk;
      }

      cache.forEach(chunk => game.showChunk(chunk));

      game.voxels.on('missingChunk', position => {
        if (!isChunkAvailable(position)) return;
        game.showChunk(getCachedChunk(position));
      });

      vm.on('message', (message) => {
        const object = game.getObject(message.objectId);

        switch(message.type) {
          case 'getNearestVoxels': {
            const { params: vids } = message;
            const { position } = object;

            const result = mapService.searchForNearestVoxel(position, vids);
            if (!result) break;

            const [voxelId, p0, p1] = result;
            vm.sendResponse(message.objectId, message.requestId, [
              p0, [8, 9, 10, 11, 12, 13, 14, 15].indexOf(voxelId) === -1 ? 0 : 1, p1,
            ]);
            break;
          }
          case 'moveTo': {
            const { params } = message;
            const { position } = object;

            const path = mapService.findPath(position, params);

            object.move(path).then(() => {
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
          case 'jump': {
            const { params } = message;
            const { position } = object;

            object.jump().then(() => {
              vm.sendResponse(message.objectId, message.requestId);
            });
          }
        }
      });

      // Rendering

      const fsm = new ModeFsm();
      const fpsMode = new FpsMode(fsm, game, player, fpsFocus, statusPanel);
      const topDownMode = new TopDownMode(fsm, game, codeEditor);

      fsm.init({
        fpsMode,
        transitionMode: new TransitionMode(fsm, game, codeEditor),
        topDownMode,
        toFpsMode: new ToFpsMode(fsm, game, codeEditor),
      }, fpsMode);

      const helperBehavior = new HelperBehavior(mapService, player, helper);

      let topDownEntered = false;

      topDownMode.on('enter', () => {
        if (topDownEntered) return;
        topDownEntered = true;

        o.style.display = 'block';
        player.emit('message', helper, `Let's start to teach Cubie how to work!`, () => {
          o.style.display = 'none';

          const actionButton = codeEditor.actionButton; // getActionButton();

          tipBalloon.show();
          tipBalloon.attach(actionButton);

          const p0 = getPoint0(tipBalloon.balloon);
          const p1 = getPoint1(actionButton);

          tipBalloon.makeHole(p0.x - MARGIN, p0.y - MARGIN, p1.x + MARGIN, p1.y + MARGIN);

          codeEditor.once('play', () => {
            tipBalloon.hide();

            player.emit('message', helper, `Good job!`, () => {
            });
          });
        });
      });

      topDownMode.on('leave', () => {
        console.log('leave!');
      });

      shell.on('gl-resize', () => fsm.current.onResize());
      shell.on('gl-render', () => fsm.current.onRender());
      game.on('tick', dt => {
        helperBehavior.onTick(dt);
        fsm.current.onTick(dt);
      });
      game.on('useVoxel', (position: vec3) => handleUseVoxel(player, position[0], position[1], position[2]));

      overlay.hide();
    });
  }).catch(err => {
    console.error(err);
  });
}

export default main;
