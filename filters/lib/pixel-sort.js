// @aufbau/filters/lib/pixel-sort.js
// canvas-only: the classic databending glitch — within each row (or column), spans of
// pixels brighter than `threshold` are sorted by luminance. impossible with svg/css.

export const id   = 'pixel-sort';
export const name = 'Pixel Sort';
export const vars = {
  threshold : { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
  vertical  : { type: 'boolean', default: false },
};

export function canvas (image, options = {}) {
  const threshold = (options.threshold ?? vars.threshold.default) * 255;
  const vertical  = options.vertical === true;
  const { data, width, height } = image;
  const lum = i => data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

  const lines = vertical ? width : height;
  const len   = vertical ? height : width;
  for (let l = 0; l < lines; l++) {
    let span = [];
    const flush = () => {
      if (span.length > 1) {
        const px = span.map(i => [data[i], data[i + 1], data[i + 2], data[i + 3], lum(i)]);
        px.sort((a, b) => a[4] - b[4]);
        span.forEach((i, k) => { data[i] = px[k][0]; data[i + 1] = px[k][1]; data[i + 2] = px[k][2]; data[i + 3] = px[k][3]; });
      }
      span = [];
    };
    for (let k = 0; k < len; k++) {
      const x = vertical ? l : k;
      const y = vertical ? k : l;
      const i = (y * width + x) * 4;
      if (lum(i) > threshold) span.push(i); else flush();
    }
    flush();
  }
}

export default canvas;
