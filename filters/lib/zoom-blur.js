// @aufbau/filters/lib/zoom-blur.js
// webgl-only: radial/zoom blur — samples along the line toward the centre. this is the
// real effect our svg `barrel-blur` only approximated with an edge falloff.

export const id   = 'zoom-blur';
export const name = 'Zoom Blur';
export const vars = {
  strength : { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02 },
};

export const webgl = {
  fragment: `
    uniform float uStrength;
    void main () {
      vec2 c = vUv - 0.5;
      vec4 sum = vec4(0.0);
      const int N = 16;
      for (int i = 0; i < N; i++) {
        float t = float(i) / float(N - 1);
        sum += texture2D(uSource, vUv - c * t * uStrength);
      }
      gl_FragColor = sum / float(N);
    }`,
  uniforms: (o = {}) => ({ uStrength: Number(o.strength ?? vars.strength.default) }),
};
