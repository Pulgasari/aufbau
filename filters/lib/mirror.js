// @aufbau/filters/lib/mirror.js
// webgl-only: reflect one half of the image onto the other. `vertical` mirrors across
// the horizontal axis instead; `flip` chooses which half is the source. mirror is a
// geometry reflection, not a filter primitive — svg cannot do it.

export const id   = 'mirror';
export const name = 'Mirror';
export const vars = {
  vertical : { type: 'boolean', default: false },
  flip     : { type: 'boolean', default: false },
};

export const webgl = {
  fragment: `
    uniform float uVertical;
    uniform float uFlip;
    void main () {
      vec2 uv = vUv;
      float t = uVertical > 0.5 ? uv.y : uv.x;
      // keep the first half and mirror it, or the second half when flipped.
      t = uFlip > 0.5 ? (t < 0.5 ? 1.0 - t : t) : (t < 0.5 ? t : 1.0 - t);
      if (uVertical > 0.5) uv.y = t; else uv.x = t;
      gl_FragColor = texture2D(uSource, uv);
    }`,
  uniforms: (o = {}) => ({ uVertical: o.vertical === true, uFlip: o.flip === true }),
};
