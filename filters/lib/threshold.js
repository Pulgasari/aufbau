// @aufbau/filters/lib/threshold.js
// canvas-only: hard 1-bit cut of the luminance at `level`. (svg can approximate this
// with a discrete transfer, but it lives here as a plain imageData example.)

export const id   = 'threshold';
export const name = 'Threshold';
export const vars = {
  level : { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
};

export function canvas (image, options = {}) {
  const level = (options.level ?? vars.level.default) * 255;
  const { data, width, height } = image;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const out  = gray >= level ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = out;
  }
}

export default canvas;
