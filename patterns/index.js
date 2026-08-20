// @aufbau/patterns
// patterns are js functions that generate svg. each one is importable on its own
// (`import dots from '@aufbau/patterns/dots'`); this barrel adds the catalogue plus
// the dom api that @aufbau/stylesheet and @aufbau/stylescript build on.
//
// two application modes:
//   datauri (default) — bakes options in and paints `background-image: url("data:…")`.
//                        css vars do not resolve inside a background-image document,
//                        so the svg is fully static.
//   defs              — injects a <pattern> once and references it by url(#id),
//                        keeping paint options (bg/fg) live via custom properties.

import { PREFIX, defsHost, encodeSvg, resolve, svgId, toElements } from './core.js';
import { patterns } from './lib/index.js';

// :::::: CATALOGUE ::::::::::::::::::::::::::::::::::::::::::::::

function metaFor (id) {
  const meta = patterns[id];
  if (!meta) throw new Error(`[@aufbau/patterns] unknown pattern "${id}"`);
  return meta;
}

// parsed catalogue for preview pages and tooling. render is dropped; callers that
// want markup go through patternSvg (or import the module directly).
export function list () {
  return Object.values(patterns).map(({ id, name, vars }) => ({ id, name, vars }));
}

// :::::: SVG BUILDING :::::::::::::::::::::::::::::::::::::::::::

// the full <svg> tile for an id. baked by default; pass { live: true } for the
// var()-driven form used by defs injection and the static assets.
export function patternSvg (id, options = {}) {
  return metaFor(id).render(options);
}

// the finished url("data:…") string for a pattern, options resolved in. no dom.
// the shared core: setPattern paints an element with it, the stylesheet skill emits
// it as a background-image value.
export function patternImage (id, options = {}) {
  return `url("${encodeSvg(patternSvg(id, options))}")`;
}

// :::::: DEFS INJECTION :::::::::::::::::::::::::::::::::::::::::

// parses the live tile, lifts its <pattern> into the shared host once per id.
export function ensurePattern (id, options = {}) {
  const host      = defsHost();
  const elementId = options.svgId ?? svgId(id);
  if (host.querySelector(`#${CSS.escape(elementId)}`)) return elementId;

  const markup = patternSvg(id, { live: true, ...options, svgId: elementId });
  const node   = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('pattern');
  if (node) host.appendChild(node);
  return elementId;
}

// :::::: PUBLIC API ::::::::::::::::::::::::::::::::::::::::::::::

// applies a pattern to one or more targets.
// @param {'datauri'|'defs'} [options.mode='datauri']
export function applyPattern (target, id, options = {}) {
  const { mode = 'datauri', ...userVars } = options;
  const elements = toElements(target);
  if (elements.length === 0) return;
  const meta = metaFor(id);

  if (mode === 'defs') {
    ensurePattern(id);
    for (const el of elements) {
      for (const key in meta.vars) {
        if (userVars[key] != null) el.style.setProperty(`${PREFIX}${key}`, String(userVars[key]));
      }
      el.style.backgroundImage = `url(#${svgId(id)})`;
      el.dataset.aufbauPattern = id;
    }
    return;
  }

  const image = patternImage(id, userVars);
  for (const el of elements) {
    el.style.backgroundImage = image;
    el.dataset.aufbauPattern = id;
  }
}

// removes a previously applied pattern and its inline custom properties.
export function removePattern (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('background-image');
    for (const prop of [...el.style].filter(p => p.startsWith(PREFIX))) el.style.removeProperty(prop);
    delete el.dataset.aufbauPattern;
  }
}

// binds one pattern + option set into a small handle for stylescript and component
// code: `const dots = usePattern('dots', { fg: '#f00' })`.
export function usePattern (id, options = {}) {
  return {
    id,
    image  : (opts = options) => patternImage(id, opts),
    css    : (opts = options) => `background-image: ${patternImage(id, opts)};`,
    ensure : () => ensurePattern(id, options),
    apply  : (target, opts = options) => applyPattern(target, id, opts),
    remove : target => removePattern(target),
    svg    : (opts = options) => patternSvg(id, opts),
  };
}

export { patterns };

export default {
  applyPattern, ensurePattern, list, patternImage, patternSvg, patterns, removePattern, usePattern,
};
