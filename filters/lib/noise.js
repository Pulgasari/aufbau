// @aufbau/filters/lib/noise.js
// webgl-only: animated film grain via a hash. drive uTime in a rAF loop for live grain;
// at uTime = 0 it is a fixed grain pattern. the gpu port of the svg `grain` for realtime.

// shared glsl: hash, value noise and 4-octave fbm. reused by displace/glitch (svg's
// feTurbulence has no glsl equivalent, so effects that displaced by turbulence need this).
export const NOISE = `
  float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise (vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm (vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
`;

export const id   = 'noise';
export const name = 'Noise';
export const vars = {
  amount : { type: 'number', default: 0.15, min: 0, max: 1, step: 0.01 },
  scale  : { type: 'number', default: 1, min: 0.3, max: 4, step: 0.1 },
};

export const webgl = {
  fragment: `
    uniform float uAmount;
    uniform float uScale;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    void main () {
      vec4 c = texture2D(uSource, vUv);
      float n = hash(floor(vUv * uResolution / uScale) + uTime * 71.0);
      gl_FragColor = vec4(c.rgb + (n - 0.5) * uAmount, c.a);
    }`,
  uniforms: (o = {}) => ({
    uAmount: Number(o.amount ?? vars.amount.default),
    uScale: Number(o.scale ?? vars.scale.default),
  }),
};
