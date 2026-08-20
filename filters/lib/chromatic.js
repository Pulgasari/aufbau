// @aufbau/filters/lib/chromatic.js
// webgl, single-pass: chromatic aberration — the red and blue channels are sampled with
// an opposite offset along `angle`. the realtime gpu port of the rgb-shift / glitch look,
// cheap enough to run per video frame.

export const id   = 'chromatic';
export const name = 'Chromatic';
export const vars = {
  amount : { type: 'number', default: 6, min: 0, max: 40, step: 1, unit: 'px' },
  angle  : { type: 'angle', default: 0, min: 0, max: 360, step: 1, unit: 'deg' },
};

export const webgl = {
  fragment: `
    uniform float uAmount;
    uniform float uAngle;
    void main () {
      vec2 dir = vec2(cos(uAngle), sin(uAngle)) * uAmount / uResolution;
      float r = texture2D(uSource, vUv + dir).r;
      float g = texture2D(uSource, vUv).g;
      float b = texture2D(uSource, vUv - dir).b;
      float a = texture2D(uSource, vUv).a;
      gl_FragColor = vec4(r, g, b, a);
    }`,
  uniforms: (o = {}) => ({
    uAmount: Number(o.amount ?? vars.amount.default),
    uAngle: Number(o.angle ?? vars.angle.default) * Math.PI / 180,
  }),
};
