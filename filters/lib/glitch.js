// @aufbau/filters/lib/glitch.js
// webgl-only: realtime glitch — horizontal blocks jump sideways and the channels split,
// all driven by a hash of the row and time. the gpu port of the svg glitch/bad-tv family,
// cheap enough for video. drive uTime in a rAF loop for the flickering motion.

export const id   = 'glitch';
export const name = 'Glitch';
export const vars = {
  intensity : { type: 'number', default: 0.5, min: 0, max: 1, step: 0.02 },
  speed     : { type: 'number', default: 1, min: 0, max: 4, step: 0.1 },
  blocks    : { type: 'number', default: 40, min: 5, max: 120, step: 1 },
};

export const webgl = {
  fragment: `
    uniform float uIntensity;
    uniform float uSpeed;
    uniform float uBlocks;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    void main () {
      float t   = floor(uTime * uSpeed * 8.0);
      float row = floor(vUv.y * uBlocks);
      float r   = hash(vec2(row, t));
      // only some rows glitch at any moment; those shift horizontally.
      float shift = r > 0.7 ? (hash(vec2(row, t + 1.0)) - 0.5) * uIntensity * 0.25 : 0.0;
      vec2 uv = vec2(fract(vUv.x + shift), vUv.y);
      float amt = uIntensity * 0.01 * (0.5 + r);
      float cr = texture2D(uSource, uv + vec2(amt, 0.0)).r;
      float cg = texture2D(uSource, uv).g;
      float cb = texture2D(uSource, uv - vec2(amt, 0.0)).b;
      gl_FragColor = vec4(cr, cg, cb, texture2D(uSource, uv).a);
    }`,
  uniforms: (o = {}) => ({
    uIntensity: Number(o.intensity ?? vars.intensity.default),
    uSpeed: Number(o.speed ?? vars.speed.default),
    uBlocks: Number(o.blocks ?? vars.blocks.default),
  }),
};
