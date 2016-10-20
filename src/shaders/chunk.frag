#extension GL_OES_standard_derivatives : enable

precision highp float;

varying vec2 vUv;

void main(void) {

  float gridThickness = 0.05;
  vec3 gridColor = vec3(1.0, 1.0, 1.0);

  // Edge
  vec2 eThickness = vec2(gridThickness, gridThickness) / 2.0;

  vec2 ef = fract(vUv);
  ef = min(ef, 1.0 - ef);

  vec2 eDelta = fwidth(ef);
  ef = smoothstep(ef - eDelta, ef + eDelta, eThickness);

  float opacity = clamp(ef.x + ef.y, 0.0, 1.0);

  if(opacity < 0.5) discard;

  gl_FragColor = vec4(gridColor, 0.5);
}
