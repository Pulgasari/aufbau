// @aufbau/filters/lib/displace.js
// webgl-only: turbulence displacement — warps the image by fbm noise. the realtime gpu
// port of the svg `wave`/`wobble` displacement (feTurbulence has no glsl equivalent, so
// this carries its own fbm from noise.js). drive uTime in a rAF loop for a living warp.

import { NOISE } from './noise.js';

export const id   = 'displace';
export const name = 'Displace';
export const vars = {
  amount : { type: 'number', default: 20, min: 0, max: 100, step: 1, unit: 'px' },
  scale  : { type: 'number', default: 3, min: 0.5, max: 12, step: 0.5 },
  speed  : { type: 'number', default: 0.3, min: 0, max: 2, step: 0.05 },
};

export const webgl = {
  fragment: `
    uniform float uAmount;
    uniform float uScale;
    uniform float uSpeed;
    ${NOISE}
    void main () {
      float t = uTime * uSpeed;
      float nx = fbm(vUv * uScale + t);
      float ny = fbm(vUv * uScale + vec2(5.2, 1.3) + t);
      vec2 uv = vUv + (vec2(nx, ny) - 0.5) * uAmount / uResolution;
      gl_FragColor = texture2D(uSource, clamp(uv, 0.0, 1.0));
    }`,
  uniforms: (o = {}) => ({
    uAmount: Number(o.amount ?? vars.amount.default),
    uScale: Number(o.scale ?? vars.scale.default),
    uSpeed: Number(o.speed ?? vars.speed.default),
  }),
};
