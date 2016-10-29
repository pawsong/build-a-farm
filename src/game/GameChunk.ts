import ndarray from 'ndarray';
const createShader = require('gl-shader');
const createBuffer = require('gl-buffer');
const createVAO = require('gl-vao');
import { NavMesher, NavMesh } from '@voxeline/pathfinder';
import Chunk from '@voxeline/engine/lib/Chunk';

const VERTEX_SIZE = 8;

const navmesher = new NavMesher();

function writeVertex(data: Float32Array, idx: number, x: number, y: number, z: number, u: number, v: number) {
  // attrib1
  data[idx+0] = x;
  data[idx+1] = y;
  data[idx+2] = z;

  // attrib2
  data[idx+4] = u;
  data[idx+5] = v;
  return idx + VERTEX_SIZE;
}

function createNavMeshVao(gl: WebGLRenderingContext, mesh: NavMesh) {
  if (mesh.nodes.length === 0) return null;

  const data = new Float32Array(mesh.nodes.length * 6 * VERTEX_SIZE);
  let ptr = 0;

  for (let i = 0, len = mesh.nodes.length; i < len; ++i) {
    const node = mesh.nodes[i];
    ptr = writeVertex(data, ptr, node.lo[0], node.y, node.lo[1], 0, 0);
    ptr = writeVertex(data, ptr, node.lo[0], node.y, node.hi[1], 0, 1);
    ptr = writeVertex(data, ptr, node.hi[0], node.y, node.lo[1], 1, 0);
    ptr = writeVertex(data, ptr, node.hi[0], node.y, node.hi[1], 1, 1);
    ptr = writeVertex(data, ptr, node.hi[0], node.y, node.lo[1], 1, 0);
    ptr = writeVertex(data, ptr, node.lo[0], node.y, node.hi[1], 0, 1);
  }

  const buffer = createBuffer(gl, data);
  const vao = createVAO(gl, [{
    buffer,
    type: gl.FLOAT,
    size: 4,
    offset: 0,
    stride: VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT,
    normalized: false,
  }, {
    buffer,
    type: gl.FLOAT,
    size: 4,
    offset: 4 * Float32Array.BYTES_PER_ELEMENT,
    stride: VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT,
    normalized: false,
  }]);
  vao.length = ptr / VERTEX_SIZE;
  return vao;
}

class GameChunk extends Chunk {
  static createNavMeshShader(gl: WebGLRenderingContext) {
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

  private navmesh: NavMesh;
  private navmeshNeedsToUpdate: boolean;

  private navmeshVaoSource: NavMesh;
  private navmeshVao: any;

  constructor(data: ndarray, p0: number, p1: number, p2: number) {
    super(data, p0, p1, p2);

    this.navmeshNeedsToUpdate = true;
    this.navmeshVaoSource = null;
  }

  set(x: number, y: number, z: number, val: number) {
    this.navmeshNeedsToUpdate = true;
    return super.set(x, y, z, val);
  }

  getNavMesh() {
    if (this.navmeshNeedsToUpdate) {
      this.navmesh = navmesher.build(
        navmesher.pad(this.data),
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
      this.navmeshVaoSource = mesh;
    }
    return this.navmeshVao;
  }
}

export default GameChunk;
