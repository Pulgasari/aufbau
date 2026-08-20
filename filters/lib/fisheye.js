// @aufbau/filters/lib/fisheye.js
// webgl-only: real lens distortion. positive amount bulges (fisheye), negative pinches
// (pincushion). not expressible with svg filter primitives.

export const id   = 'fisheye';
export const name = 'Fisheye';
export const vars = {
  amount : { type: 'number', default: 1, min: -2, max: 2, step: 0.05 },
};

export const webgl = {
  fragment: `
    uniform float uAmount;
    void main () {
      vec2 c  = vUv - 0.5;
      float r = length(c);
      vec2 uv = c * (1.0 + r * r * uAmount) + 0.5;
      gl_FragColor = (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)
        ? vec4(0.0, 0.0, 0.0, 0.0)
        : texture2D(uSource, uv);
    }`,
  uniforms: (o = {}) => ({ uAmount: Number(o.amount ?? vars.amount.default) }),
};
