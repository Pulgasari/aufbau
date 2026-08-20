// @aufbau/patterns/core.js
// shared string + dom helpers, mirroring @aufbau/filters/core.js. patterns differ
// from filters in that they have a data-uri form (a full <svg> painted as a
// background-image) as well as a defs form (a <pattern> injected and referenced by
// url(#id)). the dom helpers are only called from the browser api, never at import
// time, so this stays node-safe for the generation script.

export const PREFIX  = '--aufbau-pattern-';
export const HOST_ID = 'aufbau-pattern-defs';

export const svgId = id => `aufbau-pattern-${id}`;

// resolves every declared var to a value string. baked mode (default) yields the
// literal value; live mode yields `var(--aufbau-pattern-<key>, <default>)`. a spec
// may set `bake: true` to stay literal even in live mode — used for geometry that
// lands in a plain svg attribute (width, r, patternTransform), which cannot read a
// css var; only paint vars (fill/stroke) resolve live.
export function resolve (vars, options = {}) {
  const live = options.live === true;
  const out  = {};
  for (const key in vars) {
    const spec  = vars[key];
    const baked = String(options[key] ?? spec.default);
    out[key] = live && !spec.bake ? `var(${PREFIX}${key}, ${spec.default})` : baked;
  }
  return out;
}

// wraps a pattern body in a full tile document. the <pattern> carries the id so
// defs mode can lift it out; the trailing <rect> paints the tile so the same
// string works as a data-uri background-image.
export function patternTag (id, size, body, transform, options = {}) {
  const elementId = options.svgId ?? svgId(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<defs><pattern id="${elementId}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${transform})">${body.trim()}</pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#${elementId})"/>` +
  `</svg>`;
}

// encodes an svg string into a css-safe data uri (single quotes, minimal percent
// escaping) for use as a background-image value.
export function encodeSvg (svg) {
  const compact = svg.replace(/\s+/g, ' ').replace(/"/g, "'").trim();
  return `data:image/svg+xml,${compact.replace(/[<>#%{}|\\^`]/g, c => '%' + c.charCodeAt(0).toString(16))}`;
}

export function toElements (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(el => el instanceof Element);
  return [];
}

export function defsHost () {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.id = HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(host);
  }
  return host;
}
