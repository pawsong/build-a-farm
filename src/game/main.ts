import vec3 from 'gl-matrix/src/gl-matrix/vec3';
import mat4 from 'gl-matrix/src/gl-matrix/mat4';
import JSZip from 'jszip';
import dat from 'dat.gui/build/dat.gui.js';

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
const v2 = vec3.create();

const cp = vec3.create();
const cv = vec3.create();

const createRay = require('ray-aabb');

import Stats from 'stats.js';
import axios from 'axios';
import pako from 'pako';
const msgpack = require('msgpack-lite');
const cwise = require('cwise');

import ndarray from 'ndarray';
const ops = require('ndarray-ops');

import {
  searchForNearestVoxel1,
  searchForNearestVoxel7,
} from './ndops/searchForNearestVoxel';

import achievements from './achievements';

import BLOCKS from './blocks';

import {
  Game,
  GameObject,
  Camera,
  TopDownCamera,
  Chunk,
} from '@buffy/voxel-engine';
import FpsCamera from '@buffy/voxel-engine/lib/cameras/FpsCamera';
import TransitionCamera from '@buffy/voxel-engine/lib/cameras/TransitionCamera';
import FpsControl from '@buffy/voxel-engine/lib/controls/FpsControl';
import { lookAt } from '@buffy/voxel-engine/lib/utils/mat4';

import Overlay from '../ui/Overlay';
import TipBalloon from '../ui/TipBalloon';
import LoadingSpinner from '../ui/LoadingSpinner';

import CodeEditor from '../components/CodeEditor';
import Notification from '../components/Notification';
import StatusPanel from '../components/StatusPanel';
import Dialogue from '../components/Dialogue';

import HelperBehavior from './behaviors/HelperBehavior';
import WorkerBehavior from './behaviors/WorkerBehavior';
import PlayerBehavior from './behaviors/PlayerBehavior';
import ElevatorBehavior from './behaviors/ElevatorBehavior';

const map: string = require('file!./models/map.msgpack');
const hero: string = require('file!./models/cube.msgpack');
const helperModelUrl: string = require('file!./models/helper.msgpack');
const drop: string = require('file!./models/drop.msgpack');
const sprout: string = require('file!./models/sprout.msgpack');
const hooman: string = require('file!./models/hooman.msgpack');
const chick: string = require('file!./models/chick.msgpack');

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

// Stats
const stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
stats.dom.style.top = 'inherit';
stats.dom.style.bottom = '0';
document.body.appendChild(stats.dom);

async function fetchObjectModel(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const decoded = msgpack.decode(new Uint8Array(response.data as ArrayBuffer));
  const palette = new Uint32Array(decoded.palette);
  const inflated = pako.inflate(new Uint8Array(decoded.buffer));
  const matrix = ndarray(new Uint16Array(inflated.buffer), decoded.shape, decoded.stride, decoded.offset);
  return { matrix, palette };
}

async function fetchChunks(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const decoded = msgpack.decode(new Uint8Array(response.data as ArrayBuffer));

  return decoded.map(item => {
    const inflated = pako.inflate(new Uint8Array(item.buffer));
    const matrix = ndarray(new Uint16Array(inflated.buffer), item.shape, item.stride, item.offset);

    return {
      matrix,
      position: item.position,
    }
  });
}

async function fetchTexturePack(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const zip = new JSZip();
  await zip.loadAsync(response.data);

  const promises = [];
  const files = {};
  zip.forEach((relativePath, file) => {
    promises.push(file.async('arraybuffer').then(data => files[relativePath] = data));
  });
  await Promise.all(promises);
  return files;
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
  codeEditor: CodeEditor;
  statusPanel: StatusPanel;
  notification: Notification;
  dialogue: Dialogue;
  vm: VirtualMachine;
  overlay: Overlay;
  loadingSpinner: LoadingSpinner;
}

async function main ({
  container,
  codeEditor,
  statusPanel,
  notification,
  dialogue,
  vm,
  overlay,
  loadingSpinner,
}: MainOptions) {
  const tipBalloon = new TipBalloon();

  const [
    shell,
    chunks,
    {matrix, palette},
    helperModelData,
    waterDropData,
    hoomanData,
    chickData,
    pack,
    iconExclamationMarkImage,
    iconQuestionMarkImage,
    iconWheatPlusOne1Image,
    iconWheatPlusOne2Image,
    iconWheatPlusOne3Image,
  ] = <any> await Promise.all([
    Game.initShell(),
    fetchChunks(map),
    fetchObjectModel(hero),
    fetchObjectModel(helperModelUrl),
    fetchObjectModel(drop),
    fetchObjectModel(hooman),
    fetchObjectModel(chick),
    fetchTexturePack(resourceUrl),
    fetchNonBlockTexture(iconExclamationMarkUrl),
    fetchNonBlockTexture(iconQuestionMarkUrl),
    fetchNonBlockTexture(iconWheatPlusOne1Url),
    fetchNonBlockTexture(iconWheatPlusOne2Url),
    fetchNonBlockTexture(iconWheatPlusOne3Url),
  ]);

  shell.on('gl-render', () => stats.update());

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
  await new Promise(resolve => game.stitcher.once('addedAll', resolve));

  const cache: Map<string, Chunk> = new Map<string, Chunk>();

  chunks.forEach(chunk => {
    const { matrix, position } = chunk;
    matrix.position = position;

    const key = position.join('|');
    cache.set(key, game.createChunk(matrix, position[0], position[1], position[2]));
  });

  const cubieModel = game.addModel('cubie', matrix, palette);
  const helperModel = game.addModel('helper', helperModelData.matrix, helperModelData.palette);
  const waterDropModel = game.addModel('waterdrop', waterDropData.matrix, waterDropData.palette);
  const hoomanModel = game.addModel('hooman', hoomanData.matrix, hoomanData.palette);
  const chickModel = game.addModel('chick', chickData.matrix, chickData.palette);

  const mapService = new MapService(game, chunks);

  game.stitcher.addNonBlockTexture('icon_exclamation_mark', iconExclamationMarkImage);
  game.stitcher.addNonBlockTexture('icon_question_mark', iconQuestionMarkImage);
  game.stitcher.addNonBlockTexture('icon_wheat_plus_one_1', iconWheatPlusOne1Image);
  game.stitcher.addNonBlockTexture('icon_wheat_plus_one_2', iconWheatPlusOne2Image);
  game.stitcher.addNonBlockTexture('icon_wheat_plus_one_3', iconWheatPlusOne3Image);

  game.stitcher.updateTextureSideID();

  const elevatorData = ndarray(new Uint16Array(2 * 1 * 2), [2, 1, 2]);
  ops.assigns(elevatorData, 4);

  const elevatorModel = game.addVoxelModel('elevator', elevatorData);

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

  function handleUseVoxel(gameObject: GameObject, position: vec3) {
    const [x, y, z] = position;
    const voxelId = game.getVoxel(x, y, z);

    switch(voxelId) {
      case 6: {
        gameObject.holdItem(waterdrop);
        giveAchievement('GET_WATER');
        gameObject.emit('getitem', voxelId);
        break;
      }
      case 7: {
        if (gameObject.item === waterdrop) {
          giveAchievement('GROW_A_SPROUT');
          mapService.setBlock(x, y + 1, z, 9);
          gameObject.throwItem();
        }
        break;
      }
      case 9: {
        if (gameObject.item === waterdrop) {
          mapService.setBlock(x, y, z, 11);
          gameObject.throwItem();
        }
        break;
      }
      case 11: {
        if (gameObject.item === waterdrop) {
          mapService.setBlock(x, y, z, 13);
          gameObject.throwItem();
        }
        break;
      }
      case 13: {
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

        gameObject.emit('getitem', voxelId);
        break;
      }
    }

    gameObject.emit('voxelused', voxelId, position);
  }

  const player = new Character('player', cubieModel, {
    name: 'Player',
  });
  player.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
  player.setPosition(35, 2, 68);
  // player.setPosition(0, 4, 0);
  player.lookAt(vec3.set(v0, 34, 2, 68));
  game.addObject(player);

  player.on('message', (speaker, message, callback) => {
    dialogue.showMessage(speaker.name, message).then(() => callback());
  });

  const helper = new Character('helper', helperModel, {
    name: 'Neko',
  });
  helper.setBehavior(new HelperBehavior(helper, player, mapService));

  helper.setPosition(20, 2, 45);
  helper.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
  // helper.lookAt(vec3.fromValues(8, 2, 33));
  helper.addSprite(sprite);
  // helper.on('appear', () => console.log('good!'));
  game.addObject(helper);

  const a = new Character('a', hoomanModel, {
    name: 'Cubie A',
  });
  a.setBehavior(new WorkerBehavior(a, player, codeEditor, overlay, tipBalloon));
  a.setPosition(7, 2, 40);
  a.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
  a.lookAt(vec3.fromValues(8, 2, 40));
  game.addObject(a);

  const b = new Character('b', chickModel, {
    name: 'Cubie B',
  });
  b.setBehavior(new WorkerBehavior(b, player, codeEditor, overlay, tipBalloon));
  b.setPosition(9, 7, 37);
  b.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
  b.lookAt(vec3.fromValues(10, 7, 37));
  game.addObject(b);

  const c = new Character('c', cubieModel, {
    name: 'Cubie C',
  });
  c.setBehavior(new WorkerBehavior(c, player, codeEditor, overlay, tipBalloon));
  c.setPosition(11, 4, 43);
  c.setScale(1.5 / 16, 1.5 / 16, 1.5 / 16);
  c.lookAt(vec3.fromValues(12, 4, 43));
  game.addObject(c);

  const elevator = new Character('elevator', elevatorModel, {
    name: 'Elevator',
    mass: Infinity,
    gravityMultiplier: 0,
  });
  elevator.setBehavior(new ElevatorBehavior(elevator));
  elevator.setPosition(29, 3, 6);
  game.addObject(elevator);

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

    return game.createChunk(voxelsPadded, position[0], position[1], position[2]);
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

  // game.voxels.on('missingChunk', position => {
  //   if (!isChunkAvailable(position)) return;
  //   game.showChunk(getCachedChunk(position));
  // });

  vm.on('stop', thread => {
    const object = game.getObject(thread.objectId);
    object.stop(false);
  });

  vm.on('api', async (child, params) => {
    try {
      const object = game.getObject(params.objectId);

      switch(params.api) {
        case 'getNearestVoxels': {
          const vids = params.body;
          const { position } = object;

          const result = mapService.searchForNearestVoxel(position, vids);
          if (!result) break;

          const [voxelId, p0, p1] = result;
          child.sendResponse(params.objectId, params.requestId, [
            p0, [8, 9, 10, 11, 12, 13, 14, 15].indexOf(voxelId) === -1 ? 0 : 1, p1,
          ]);
          break;
        }
        case 'use': {
          const target = params.body;
          const { position } = object;
          const path = mapService.findPath(position, target);

          await object.move(path);

          handleUseVoxel(object, target);

          child.sendResponse(params.objectId, params.requestId);
          break;
        }
        case 'jump': {
          const { position } = object;
          await object.jump();
          child.sendResponse(params.objectId, params.requestId);
          break;
        }
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Rendering

  const fsm = new ModeFsm();
  const fpsMode = new FpsMode(fsm, game, player);
  const topDownMode = new TopDownMode(fsm, game, codeEditor);

  fpsMode.on('enter', () => {
    statusPanel.show();
  });

  fpsMode.on('leave', () => {
    statusPanel.hide();
  });

  fsm.init({
    fpsMode,
    transitionMode: new TransitionMode(fsm, game, codeEditor),
    topDownMode,
    toFpsMode: new ToFpsMode(fsm, game, codeEditor),
  }, fpsMode);

  shell.on('gl-resize', () => fsm.current.onResize());
  shell.on('gl-render', () => fsm.current.onRender());
  game.on('tick', dt => {
    fsm.current.onTick(dt);
  });
  player.on('usevoxel', (position: vec3) => handleUseVoxel(player, position));

  overlay.hide();
  loadingSpinner.hide();

  // App started!

  console.log('start!');

  const gui = new dat.GUI();
  gui.add(fpsMode, 'showAABB');
  gui.add(fpsMode, 'showChunkBounds');
}

export default main;
