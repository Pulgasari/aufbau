// @aufbau/patterns
// patterns are js functions that generate svg. each one is importable on its own
// (`import dots from '@aufbau/patterns/dots.js'`); this barrel adds the catalogue plus
// the dom api that @aufbau/stylesheet and @aufbau/stylescript build on.
//
// the catalogue is lazy: metadata (id, name, vars) comes from ./manifest.js, a
// single cheap file, while each pattern's render implementation loads on demand
// from ./lib/<id>.js the first time it is applied. so importing this barrel — or
// listing the catalogue — no longer pulls in every implementation. the render
// path (patternSvg/patternImage/applyPattern/…) is therefore async.
//
// two application modes:
//   datauri (default) — bakes options in and paints `background-image: url("data:…")`.
//                        css vars do not resolve inside a background-image document,
//                        so the svg is fully static.
//   defs              — injects a <pattern> once and references it by url(#id),
//                        keeping paint options (bg/fg) live via custom properties.

import { PREFIX, defsHost, encodeSvg, resolve, svgId, toElements } from './core.js';
import { manifest } from './manifest.js';
import { applyMotion, stopMotion, MOTIONS, motionCss, motionKeyframes } from './motion.js';

export { applyMotion, stopMotion, MOTIONS, motionCss, motionKeyframes };

// :::::: CATALOGUE ::::::::::::::::::::::::::::::::::::::::::::::

// static metadata (id, name, vars). synchronous, no implementation loaded.
function metaOf (id) {
  const meta = manifest[id];
  if (!meta) throw new Error(`[@aufbau/patterns] unknown pattern "${id}"`);
  return meta;
}

// the render implementation for one pattern, loaded once and cached. returns
// { id, name, vars, render } — render(options) -> the <svg> tile markup.
const loaded = new Map();
function load (id) {
  metaOf(id); // validate before importing
  if (!loaded.has(id)) {
    loaded.set(id, import(`./lib/${id}.js`).then(m => ({ id, name: m.name, vars: m.vars, render: m.default })));
  }
  return loaded.get(id);
}

// parsed catalogue for preview pages and tooling. render is dropped; callers that
// want markup go through patternSvg (or import the module directly). synchronous.
export function list () {
  return Object.values(manifest).map(({ id, name, vars }) => ({ id, name, vars }));
}

// :::::: SVG BUILDING :::::::::::::::::::::::::::::::::::::::::::

// the full <svg> tile for an id. baked by default; pass { live: true } for the
// var()-driven form used by defs injection and the static assets.
export async function patternSvg (id, options = {}) {
  return (await load(id)).render(options);
}

// the finished url("data:…") string for a pattern, options resolved in. no dom.
// the shared core: setPattern paints an element with it, the stylesheet skill emits
// it as a background-image value.
export async function patternImage (id, options = {}) {
  return `url("${encodeSvg(await patternSvg(id, options))}")`;
}

// :::::: DEFS INJECTION :::::::::::::::::::::::::::::::::::::::::

// parses the live tile, lifts its <pattern> into the shared host once per id.
export async function ensurePattern (id, options = {}) {
  const host      = defsHost();
  const elementId = options.svgId ?? svgId(id);
  if (host.querySelector(`#${CSS.escape(elementId)}`)) return elementId;

  const markup = await patternSvg(id, { live: true, ...options, svgId: elementId });
  const node   = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('pattern');
  if (node) host.appendChild(node);
  return elementId;
}

// :::::: PUBLIC API ::::::::::::::::::::::::::::::::::::::::::::::

// applies a pattern to one or more targets.
// @param {'datauri'|'defs'} [options.mode='datauri']
export async function applyPattern (target, id, options = {}) {
  const { mode = 'datauri', ...userVars } = options;
  const elements = toElements(target);
  if (elements.length === 0) return;
  const meta = metaOf(id); // vars are static, no implementation needed for defs mode

  if (mode === 'defs') {
    await ensurePattern(id);
    for (const el of elements) {
      for (const key in meta.vars) {
        if (userVars[key] != null) el.style.setProperty(`${PREFIX}${key}`, String(userVars[key]));
      }
      el.style.backgroundImage = `url(#${svgId(id)})`;
      el.dataset.aufbauPattern = id;
    }
    return;
  }

  const image = await patternImage(id, userVars);
  for (const el of elements) {
    el.style.backgroundImage = image;
    el.dataset.aufbauPattern = id;
  }
}

// removes a previously applied pattern and its inline custom properties (and any
// motion attached to it). synchronous — no implementation needed.
export function removePattern (target) {
  stopMotion(target);
  for (const el of toElements(target)) {
    el.style.removeProperty('background-image');
    for (const prop of [...el.style].filter(p => p.startsWith(PREFIX))) el.style.removeProperty(prop);
    delete el.dataset.aufbauPattern;
  }
}

// paints a pattern and scrolls the whole tiling in a direction — the animation is
// independent of the pattern's own content, so a static or a self-animated tile
// drifts just the same. options add { motion, speed, timing } on top of the paint
// options; the scroll distance is the tile size, so the loop is seamless.
// @param {'down'|'up'|'left'|'right'|'down-right'|'down-left'|'up-right'|'up-left'|string} [options.motion='down']
export async function animatePattern (target, id, options = {}) {
  const meta = metaOf(id);
  const size = options.size ?? meta.vars.size?.default ?? 20;
  await applyPattern(target, id, options);
  applyMotion(target, options.motion ?? 'down', { size, speed: options.speed, timing: options.timing });
}

// binds one pattern + option set into a small handle for stylescript and component
// code: `const dots = usePattern('dots', { fg: '#f00' })`. the render-producing
// methods (image/css/svg) are async, matching the lazy catalogue.
export function usePattern (id, options = {}) {
  return {
    id,
    image  : (opts = options) => patternImage(id, opts),
    css    : async (opts = options) => `background-image: ${await patternImage(id, opts)};`,
    ensure : () => ensurePattern(id, options),
    apply   : (target, opts = options) => applyPattern(target, id, opts),
    animate : (target, opts = options) => animatePattern(target, id, opts),
    remove  : target => removePattern(target),
    svg     : (opts = options) => patternSvg(id, opts),
  };
}

export { manifest };

export default {
  animatePattern, applyMotion, applyPattern, ensurePattern, list, manifest, motionCss, motionKeyframes,
  patternImage, patternSvg, removePattern, stopMotion, usePattern,
};
