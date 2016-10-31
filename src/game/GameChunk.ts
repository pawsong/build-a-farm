import ndarray from 'ndarray';
const createShader = require('gl-shader');
const createBuffer = require('gl-buffer');
const createVAO = require('gl-vao');
const cwise = require('cwise');
import { NavMesher, NavMesh } from '@voxeline/pathfinder';
import Chunk from '@voxeline/engine/lib/Chunk';

const NODE_VERTEX_SIZE = 8;
const POINT_VERTEX_SIZE = 3;

const navmesher = new NavMesher();

function writeNodeVertex(data: Float32Array, ptr: number, x: number, y: number, z: number, u: number, v: number) {
  // attrib1
  data[ptr+0] = x;
  data[ptr+1] = y;
  data[ptr+2] = z;

  // attrib2
  data[ptr+4] = u;
  data[ptr+5] = v;
  return ptr + NODE_VERTEX_SIZE;
}

function createNavMeshVao(gl: WebGLRenderingContext, mesh: NavMesh) {
  if (mesh.nodes.length === 0) return null;

  const data = new Float32Array(mesh.nodes.length * 6 * NODE_VERTEX_SIZE);
  let ptr = 0;

  for (const node of mesh.nodes) {
    ptr = writeNodeVertex(data, ptr, node.lo[0], node.y, node.lo[1], 0, 0);
    ptr = writeNodeVertex(data, ptr, node.lo[0], node.y, node.hi[1], 0, 1);
    ptr = writeNodeVertex(data, ptr, node.hi[0], node.y, node.lo[1], 1, 0);
    ptr = writeNodeVertex(data, ptr, node.hi[0], node.y, node.hi[1], 1, 1);
    ptr = writeNodeVertex(data, ptr, node.hi[0], node.y, node.lo[1], 1, 0);
    ptr = writeNodeVertex(data, ptr, node.lo[0], node.y, node.hi[1], 0, 1);
  }

  const buffer = createBuffer(gl, data);
  const vao = createVAO(gl, [{
    buffer,
    type: gl.FLOAT,
    size: 4,
    offset: 0,
    stride: NODE_VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT,
    normalized: false,
  }, {
    buffer,
    type: gl.FLOAT,
    size: 4,
    offset: 4 * Float32Array.BYTES_PER_ELEMENT,
    stride: NODE_VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT,
    normalized: false,
  }]);
  vao.length = ptr / NODE_VERTEX_SIZE;
  return vao;
}

export function createNavMeshShader(gl: WebGLRenderingContext) {
  const shader = createShader(gl, `
    uniform mat4 projection;
    uniform mat4 view;

    attribute vec4 attrib0;
    attribute vec4 attrib1;

    varying vec2 uv;

    void main() {
      uv = attrib1.xy;
      gl_Position = projection * view * vec4(attrib0.xyz, 1.0);
    }
  `, `
    #extension GL_OES_standard_derivatives: enable

    precision highp float;
    varying vec2 uv;

    void main() {
      float gridThickness = 0.05;

      // Edge
      vec2 eThickness = vec2(gridThickness, gridThickness) / 2.0;

      vec2 ef = fract(uv);
      ef = min(ef, 1.0 - ef);

      vec2 eDelta = fwidth(ef);
      ef = smoothstep(ef - eDelta, ef + eDelta, eThickness);

      float opacity = clamp(ef.x + ef.y, 0.0, 1.0);
      if (opacity < 0.5) discard;

      gl_FragColor = vec4(vec3(0.30, 0.69, 0.31), 0.5); // #4CAF50
    }
  `);

  shader.attributes.attrib0.location = 0;
  shader.attributes.attrib1.location = 1;
  return shader;
}

function writePointVertex(data: Float32Array, ptr: number, x: number, y: number, z: number) {
  // attrib1
  data[ptr+0] = x;
  data[ptr+1] = y;
  data[ptr+2] = z;

  return ptr + POINT_VERTEX_SIZE;
}

function createNavMeshStitchVao(gl: WebGLRenderingContext, mesh: NavMesh) {
  if (mesh.nodes.length === 0) return null;

  let size = 0;
  for (const node of mesh.nodes) {
    size += node.edges.length * 2 * POINT_VERTEX_SIZE;
  }

  const data = new Float32Array(size);
  let ptr = 0;

  for (const node of mesh.nodes) {
    for (const edge of node.edges) {
      ptr = writePointVertex(data, ptr, edge.src.center[0], edge.src.center[1], edge.src.center[2]);
      ptr = writePointVertex(data, ptr, edge.dest.center[0], edge.dest.center[1], edge.dest.center[2]);
    }
  }

  const buffer = createBuffer(gl, data);
  const vao = createVAO(gl, [{
    buffer,
    type: gl.FLOAT,
    size: POINT_VERTEX_SIZE,
  }]);
  vao.length = ptr / POINT_VERTEX_SIZE;
  return vao;
}

export function createNavMeshStitchShader(gl: WebGLRenderingContext) {
  const shader = createShader(gl, `
    uniform mat4 projection;
    uniform mat4 view;

    attribute vec3 attrib0;

    void main() {
      gl_Position = projection * view * vec4(attrib0, 1.0);
    }
  `, `
    precision highp float;

    void main() {
      gl_FragColor = vec4(vec3(0.91, 0.12, 0.39), 0.5); // #E91E63
    }
  `);

  shader.attributes.attrib0.location = 0;
  return shader;
}

const POINT_SIZE = 0.1;

function createNavMeshCenterPointVao(gl: WebGLRenderingContext, mesh: NavMesh) {
  if (mesh.nodes.length === 0) return null;

  const size = mesh.nodes.length * 6 * POINT_VERTEX_SIZE;

  const data = new Float32Array(size);
  let ptr = 0;

  for (const node of mesh.nodes) {
    const p = node.center;
    ptr = writePointVertex(data, ptr, p[0] - POINT_SIZE, p[1], p[2] - POINT_SIZE);
    ptr = writePointVertex(data, ptr, p[0] - POINT_SIZE, p[1], p[2] + POINT_SIZE);
    ptr = writePointVertex(data, ptr, p[0] + POINT_SIZE, p[1], p[2] - POINT_SIZE);
    ptr = writePointVertex(data, ptr, p[0] + POINT_SIZE, p[1], p[2] + POINT_SIZE);
    ptr = writePointVertex(data, ptr, p[0] + POINT_SIZE, p[1], p[2] - POINT_SIZE);
    ptr = writePointVertex(data, ptr, p[0] - POINT_SIZE, p[1], p[2] + POINT_SIZE);
  }

  const buffer = createBuffer(gl, data);
  const vao = createVAO(gl, [{
    buffer,
    type: gl.FLOAT,
    size: 3,
  }]);
  vao.length = ptr / POINT_VERTEX_SIZE;
  return vao;
}

interface IsSolidVoxel {
  (v: number): boolean;
}

class GameChunk extends Chunk {
  private navmesh: NavMesh;
  private navmeshNeedsToUpdate: boolean;

  private navmeshVaoSource: NavMesh;
  private navmeshVao: any;
  private navmeshStitchVao: any;
  private navmeshCenterPointVao: any;
  private isSolidVoxel: IsSolidVoxel;

  constructor(isSolidVoxel: IsSolidVoxel, data: ndarray, p0: number, p1: number, p2: number) {
    super(data, p0, p1, p2);

    this.isSolidVoxel = isSolidVoxel;
    this.navmeshNeedsToUpdate = true;
    this.navmeshVaoSource = null;
  }

  set(x: number, y: number, z: number, val: number) {
    this.navmeshNeedsToUpdate = true;
    return super.set(x, y, z, val);
  }

  getNavMesh() {
    if (this.navmeshNeedsToUpdate) {
      const padded = navmesher.pad(this.data, v =>  v && this.isSolidVoxel(v) ? 1 : 0);
      this.navmesh = navmesher.build(padded,
        this.offset[0], this.offset[1], this.offset[2],
      );
      this.navmeshNeedsToUpdate = false;
    }
    return this.navmesh;
  }

  getNavMeshVao(gl: WebGLRenderingContext) {
    const mesh = this.getNavMesh();
    if (this.navmeshVaoSource !== mesh) {
      this.navmeshVao = createNavMeshVao(gl, mesh);
      this.navmeshStitchVao = createNavMeshStitchVao(gl, mesh);
      this.navmeshCenterPointVao = createNavMeshCenterPointVao(gl, mesh);

      this.navmeshVaoSource = mesh;
    }
    return {
      navmeshVao: this.navmeshVao,
      navmeshStitchVao: this.navmeshStitchVao,
      navmeshCenterPointVao: this.navmeshCenterPointVao,
    };
  }
}

export default GameChunk;
