precision highp float;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main(){
  vUv = uv;
  gl_Position = uProjection * uView * uModel * vec4(position, 1.0);
}
