// @aufbau/filters/lib/dither.js
// canvas-only: ordered (Bayer 4×4) dithering of the luminance to `levels` tones. the
// classic newsprint / 1-bit look; not expressible with svg filter primitives.

export const id   = 'dither';
export const name = 'Dither';
export const vars = {
  levels : { type: 'integer', default: 2, min: 2, max: 6, step: 1 },
};

// 4×4 bayer matrix, normalised to (value + 0.5) / 16 thresholds.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function canvas (image, options = {}) {
  const levels = Math.max(2, Math.round(options.levels ?? vars.levels.default));
  const { data, width, height } = image;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i    = (y * width + x) * 4;
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const t    = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const scaled = gray * (levels - 1);
      const level  = Math.floor(scaled) + (scaled - Math.floor(scaled) > t ? 1 : 0);
      const out    = Math.round(level / (levels - 1) * 255);
      data[i] = data[i + 1] = data[i + 2] = out;
    }
  }
}

export default canvas;
