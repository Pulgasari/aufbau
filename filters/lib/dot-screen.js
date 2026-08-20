// @aufbau/filters/lib/dot-screen.js
// canvas-only: a true half-tone screen — each cell becomes one black dot whose radius
// grows with the cell's darkness. this is the tone-varying version svg cannot do
// (the svg `halftone`/`dot-matrix` filters are fixed-grid approximations).

export const id   = 'dot-screen';
export const name = 'Dot Screen';
export const vars = {
  size : { type: 'number', default: 8, min: 3, max: 32, step: 1, unit: 'px' },
};

export function canvas (image, options = {}) {
  const size = Math.max(3, Math.round(options.size ?? vars.size.default));
  const { data, width, height } = image;
  const src = data.slice();
  const max = size * 0.72;
  for (let cy = 0; cy < height; cy += size) {
    for (let cx = 0; cx < width; cx += size) {
      const xe = Math.min(cx + size, width);
      const ye = Math.min(cy + size, height);
      let lum = 0, n = 0;
      for (let y = cy; y < ye; y++) {
        for (let x = cx; x < xe; x++) {
          const i = (y * width + x) * 4;
          lum += src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114; n++;
        }
      }
      const radius = (1 - lum / n / 255) * max;
      const ccx = cx + size / 2, ccy = cy + size / 2;
      for (let y = cy; y < ye; y++) {
        for (let x = cx; x < xe; x++) {
          const inside = Math.hypot(x + 0.5 - ccx, y + 0.5 - ccy) <= radius;
          const i = (y * width + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = inside ? 0 : 255;
        }
      }
    }
  }
}

export default canvas;
