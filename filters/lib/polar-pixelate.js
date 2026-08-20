// @aufbau/filters/lib/polar-pixelate.js
// canvas-only: pixelation in polar space around the centre — quantises radius into
// `rings` and angle into `segments`, then samples the block centre. svg cannot do it.

export const id   = 'polar-pixelate';
export const name = 'Polar Pixelate';
export const vars = {
  rings    : { type: 'integer', default: 16, min: 2, max: 80, step: 1 },
  segments : { type: 'integer', default: 60, min: 3, max: 180, step: 1 },
};

export function canvas (image, options = {}) {
  const rings    = Math.max(2, Math.round(options.rings ?? vars.rings.default));
  const segments = Math.max(3, Math.round(options.segments ?? vars.segments.default));
  const { data, width, height } = image;
  const src  = data.slice();
  const cx   = width / 2;
  const cy   = height / 2;
  const maxR = Math.hypot(cx, cy);
  const ring = maxR / rings;
  const seg  = (Math.PI * 2) / segments;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx, dy = y - cy;
      const rq = (Math.floor(Math.hypot(dx, dy) / ring) + 0.5) * ring;
      const aq = (Math.floor((Math.atan2(dy, dx) + Math.PI) / seg) + 0.5) * seg - Math.PI;
      const sx = Math.min(width - 1,  Math.max(0, Math.round(cx + rq * Math.cos(aq))));
      const sy = Math.min(height - 1, Math.max(0, Math.round(cy + rq * Math.sin(aq))));
      const di = (y * width + x) * 4;
      const si = (sy * width + sx) * 4;
      data[di] = src[si]; data[di + 1] = src[si + 1]; data[di + 2] = src[si + 2]; data[di + 3] = src[si + 3];
    }
  }
}

export default canvas;
