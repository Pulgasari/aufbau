// @aufbau/filters/lib/gaussian-blur.js
// webgl, multi-pass: a real separable gaussian blur — one horizontal then one vertical
// pass (9 taps each, linear-sampled weights). the canonical multi-pass example; unlike
// the css/svg `blur` this is the gpu path for the editor and realtime video.

export const id   = 'gaussian-blur';
export const name = 'Gaussian Blur';
export const vars = {
  amount : { type: 'number', default: 4, min: 0, max: 20, step: 0.5, unit: 'px' },
};

// 9-tap gaussian using the standard linear-sampling offsets/weights.
const BLUR = `
  uniform vec2 uDir;
  uniform float uRadius;
  void main () {
    vec2 px = uDir / uResolution * uRadius;
    vec4 sum = texture2D(uSource, vUv) * 0.2270270270;
    sum += (texture2D(uSource, vUv + px * 1.3846153846) + texture2D(uSource, vUv - px * 1.3846153846)) * 0.3162162162;
    sum += (texture2D(uSource, vUv + px * 3.2307692308) + texture2D(uSource, vUv - px * 3.2307692308)) * 0.0702702703;
    gl_FragColor = sum;
  }`;

export const webgl = {
  passes: [
    { fragment: BLUR, uniforms: o => ({ uDir: [1, 0], uRadius: Number(o.amount ?? vars.amount.default) }) },
    { fragment: BLUR, uniforms: o => ({ uDir: [0, 1], uRadius: Number(o.amount ?? vars.amount.default) }) },
  ],
};

// exported so bloom can reuse the exact same blur fragment.
export { BLUR };
