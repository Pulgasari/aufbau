// @aufbau/filters/lib/bloom.js
// webgl, multi-pass: threshold the bright areas, blur them (separable h+v), then add the
// glow back over the original. the classic four-pass bloom, and the showcase for the
// multi-pass runner (the combine pass reads uSource0 = the untouched original).

import { BLUR } from './gaussian-blur.js';

export const id   = 'bloom';
export const name = 'Bloom';
export const vars = {
  threshold : { type: 'number', default: 0.6, min: 0, max: 1, step: 0.02 },
  radius    : { type: 'number', default: 6, min: 0, max: 20, step: 0.5 },
  strength  : { type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
};

const THRESHOLD = `
  uniform float uThreshold;
  void main () {
    vec4 c = texture2D(uSource, vUv);
    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = l > uThreshold ? vec4(c.rgb, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);
  }`;

const COMBINE = `
  uniform float uStrength;
  void main () {
    vec4 base = texture2D(uSource0, vUv);   // the untouched original
    vec4 glow = texture2D(uSource, vUv);    // the blurred bright mask
    gl_FragColor = vec4(base.rgb + glow.rgb * uStrength, base.a);
  }`;

export const webgl = {
  passes: [
    { fragment: THRESHOLD, uniforms: o => ({ uThreshold: Number(o.threshold ?? vars.threshold.default) }) },
    { fragment: BLUR, uniforms: o => ({ uDir: [1, 0], uRadius: Number(o.radius ?? vars.radius.default) }) },
    { fragment: BLUR, uniforms: o => ({ uDir: [0, 1], uRadius: Number(o.radius ?? vars.radius.default) }) },
    { fragment: COMBINE, uniforms: o => ({ uStrength: Number(o.strength ?? vars.strength.default) }) },
  ],
};
