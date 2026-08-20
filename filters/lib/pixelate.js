// @aufbau/filters/lib/pixelate.js
// canvas-only: svg filters cannot downsample, so pixelation lives in the imageData
// backend. averages each size×size block and paints the block with that colour.
// no default/svg export — this filter is realised only through filterCanvas().

export const id   = 'pixelate';
export const name = 'Pixelate';
export const vars = {
  size : { type: 'number', default: 8, min: 1, max: 64, step: 1, unit: 'px' },
};

export function canvas (image, options = {}) {
  const size = Math.max(1, Math.round(options.size ?? vars.size.default));
  const { data, width, height } = image;
  const src = data.slice();
  for (let by = 0; by < height; by += size) {
    for (let bx = 0; bx < width; bx += size) {
      const xe = Math.min(bx + size, width);
      const ye = Math.min(by + size, height);
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = by; y < ye; y++) {
        for (let x = bx; x < xe; x++) {
          const i = (y * width + x) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3]; n++;
        }
      }
      r /= n; g /= n; b /= n; a /= n;
      for (let y = by; y < ye; y++) {
        for (let x = bx; x < xe; x++) {
          const i = (y * width + x) * 4;
          data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
        }
      }
    }
  }
}

export default canvas;
