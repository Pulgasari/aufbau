// @aufbau/filters/lib/kaleidoscope.js
// webgl-only: folds the image into `segments` mirrored wedges around the centre.

export const id   = 'kaleidoscope';
export const name = 'Kaleidoscope';
export const vars = {
  segments : { type: 'integer', default: 6, min: 2, max: 24, step: 1 },
  angle    : { type: 'angle', default: 0, min: 0, max: 360, step: 1, unit: 'deg' },
};

export const webgl = {
  fragment: `
    #define PI 3.14159265359
    uniform float uSegments;
    uniform float uAngle;
    void main () {
      vec2 c = vUv - 0.5;
      float r = length(c);
      float a = atan(c.y, c.x) + uAngle;
      float seg = PI * 2.0 / uSegments;
      a = mod(a, seg);
      a = abs(a - seg * 0.5);              // fold the wedge back on itself
      vec2 uv = vec2(cos(a), sin(a)) * r + 0.5;
      gl_FragColor = texture2D(uSource, clamp(uv, 0.0, 1.0));
    }`,
  uniforms: (o = {}) => ({
    uSegments: Math.max(2, Math.round(o.segments ?? vars.segments.default)),
    uAngle: (Number(o.angle ?? vars.angle.default)) * Math.PI / 180,
  }),
};
