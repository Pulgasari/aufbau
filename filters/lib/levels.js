// @aufbau/filters/lib/levels.js
// canvas-only: photoshop-style levels — remap input [black, white] to full range with a
// gamma curve. built as a 256-entry lut applied per channel.

export const id   = 'levels';
export const name = 'Levels';
export const vars = {
  black : { type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
  white : { type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
  gamma : { type: 'number', default: 1, min: 0.1, max: 3, step: 0.05 },
};

export function canvas (image, options = {}) {
  const black = options.black ?? vars.black.default;
  const white = options.white ?? vars.white.default;
  const gamma = options.gamma ?? vars.gamma.default;
  const span  = Math.max(1e-4, white - black);
  const lut   = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const n = Math.min(1, Math.max(0, (v / 255 - black) / span));
    lut[v] = Math.pow(n, 1 / gamma) * 255;
  }
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]]; data[i + 1] = lut[data[i + 1]]; data[i + 2] = lut[data[i + 2]];
  }
}

export default canvas;
