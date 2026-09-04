// @aufbau/filters/canvas.js
// the canvas 2d backend. two paths:
//   imageData — the filter's own canvas(image, options) walks pixels (pixelate, dither…).
//   bridge    — ctx.filter runs the filter's css string, or a baked svg <filter> via
//               url(#id), onto a copy of the canvas. gives every css/svg filter a
//               canvas path with no per-filter code.
// dom is only touched at call time, so this stays safe to import in node.

import { defsHost, svgId } from './core.js';
import { load } from './lib/registry.js';
import { filterToWebgl } from './webgl.js';

// djb2, base36 — a short stable key per option set.
function hash (str) {
  let h = 5381, i = str.length;
  while (i) h = (h * 33) ^ str.charCodeAt(--i);
  return (h >>> 0).toString(36);
}

// injects a fully baked <filter> (concrete values, no css vars — canvas draws cannot
// read custom properties) once per option set, and returns its element id.
function bakedFilterId (id, meta, options) {
  const elementId = `${svgId(id)}-canvas-${hash(JSON.stringify(options))}`;
  const host      = defsHost();
  if (!host.querySelector(`#${CSS.escape(elementId)}`)) {
    const markup = meta.render({ ...options, live: false, svgId: elementId });
    const node   = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml'
    ).querySelector('filter');
    if (node) host.appendChild(node);
  }
  return elementId;
}

/**
 * applies a filter to a canvas in place. `options.backend`:
 *   'auto'      — imageData if the filter has one, else the bridge (default)
 *   'imagedata' — force the imageData backend (throws if the filter has none)
 *   'bridge'    — force the ctx.filter bridge (css/svg)
 */
export async function filterToCanvas (canvas, id, options = {}) {
  const { backend = 'auto', ...opts } = options;
  const meta = await load(id);
  const ctx  = canvas.getContext('2d');
  const { width, height } = canvas;

  if (meta.canvas && backend !== 'bridge' && backend !== 'webgl') {
    const image = ctx.getImageData(0, 0, width, height);
    meta.canvas(image, opts);
    ctx.putImageData(image, 0, 0);
    return;
  }
  if (backend === 'imagedata') throw new Error(`[@aufbau/filters] "${id}" has no imageData backend`);

  // css/svg bridge; fall through to webgl for filters that only have that backend.
  const value = backend === 'webgl' ? null
              : meta.css ? meta.css(opts)
              : meta.render ? `url(#${bakedFilterId(id, meta, opts)})`
              : null;
  if (!value) {
    if (meta.webgl) return filterToWebgl(canvas, id, options);
    throw new Error(`[@aufbau/filters] "${id}" cannot render to canvas`);
  }

  // draw the canvas through the filter onto a scratch copy, then back over the original.
  const scratch = document.createElement('canvas');
  scratch.width = width; scratch.height = height;
  const sctx = scratch.getContext('2d');
  sctx.filter = value;
  sctx.drawImage(canvas, 0, 0);

  ctx.filter = 'none';
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(scratch, 0, 0);
}
