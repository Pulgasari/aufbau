// @aufbau/patterns
// two application modes:
// — datauri (default) —
// bakes options in and paints `background-image: url("data:…")`.
// css vars do not resolve inside a background-image document,
// so the svg is fully static.
// — defs — 
// injects a <pattern> once and references it by url(#id),
// keeping paint options (bg/fg) live via custom properties.

import { PREFIX, defsHost, encodeSvg, resolve, svgId, toElements } from './core.js';
import { patterns } from './lib/index.js';
import { applyMotion, stopMotion, MOTIONS, motionCss, motionKeyframes } from './motion.js';

// :::::: CATALOGUE ::::::::::::::::::::::::::::::::::::::::::::::

function metaFor (id) {
  const meta = patterns[id];
  if (!meta) throw new Error(`[@aufbau/patterns] unknown pattern "${id}"`);
  return meta;
}

// parsed catalogue for preview pages and tooling. render is dropped; callers that
// want markup go through patternSvg (or import the module directly).
function list () {
  return Object.values(patterns).map(({ id, name, vars }) => ({ id, name, vars }));
}

// :::::: SVG BUILDING :::::::::::::::::::::::::::::::::::::::::::

// the full <svg> tile for an id. baked by default; pass { live: true } for the
// var()-driven form used by defs injection and the static assets.
function patternSvg (id, options = {}) {
  return metaFor(id).render(options);
}

// the finished url("data:…") string for a pattern, options resolved in. no dom.
// the shared core: setPattern paints an element with it, the stylesheet skill emits
// it as a background-image value.
function patternImage (id, options = {}) {
  return `url("${encodeSvg(patternSvg(id, options))}")`;
}

// :::::: DEFS INJECTION :::::::::::::::::::::::::::::::::::::::::

// parses the live tile, lifts its <pattern> into the shared host once per id.
function ensurePattern (id, options = {}) {
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
function applyPattern (target, id, options = {}) {
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

// removes a previously applied pattern and its inline custom properties
// (and any motion attached to it).
function removePattern (target) {
  stopMotion(target);
  for (const el of toElements(target)) {
    el.style.removeProperty('background-image');
    for (const prop of [...el.style].filter(p => p.startsWith(PREFIX))) el.style.removeProperty(prop);
    delete el.dataset.aufbauPattern;
  }
}

function animatePattern (target, id, options = {}) {
  const meta = metaFor(id);
  const size = options.size ?? meta.vars.size?.default ?? 20;
  applyPattern(target, id, options);
  applyMotion(target, options.motion ?? 'down', { size, speed: options.speed, timing: options.timing });
}

// binds one pattern + option set into a small handle for stylescript and component
// code: `const dots = usePattern('dots', { fg: '#f00' })`.
function usePattern (id, options = {}) {
  return {
    id,
    animate : (target, opts = options) => animatePattern(target, id, opts),
    apply   : (target, opts = options) => applyPattern(target, id, opts),
    image   : (opts = options) => patternImage(id, opts),
    css     : (opts = options) => `background-image: ${patternImage(id, opts)};`,
    ensure  : () => ensurePattern(id, options),
    remove  : target => removePattern(target),
    svg     : (opts = options) => patternSvg(id, opts),
  };
}

const data = list();

export {
  MOTIONS,
  animatePattern,
  applyPattern,
  applyMotion,
  ensurePattern,
  list,
  motionCss, 
  motionKeyframes,
  patternImage,
  patternSvg,
  patterns,
  removePattern,
  stopMotion,
  usePattern,
};

export default {
  animatePattern, 
  applyMotion, 
  applyPattern,
  ensurePattern, 
  list, 
  motionCss, 
  motionKeyframes,
  patternImage,
  patternSvg,
  patterns,
  removePattern,
  stopMotion,
  usePattern,
};
