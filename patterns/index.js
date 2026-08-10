// @aufbau/patterns/index.js

import { importFile } from '@aufbau/import';
import { encodeSvg }  from '@aufbau/js';

// single place the svg asset location is spelled out. import.meta.resolve runs
// the specifier through the host import-map; fetch/importFile cannot read the
// import-map on their own, so we resolve to a real url first.
const SVG_SPECIFIER = '@aufbau/svg/patterns/';
const DATA_URL      = import.meta.resolve(SVG_SPECIFIER + 'data.json5');
const PROP_PREFIX   = '--aufbau-pattern-';
const DEFS_HOST_ID  = 'aufbau-pattern-defs';

// :::::: METADATA :::::::::::::::::::::::::::::::::::::::::::::::

// lazy, cached. one fetch for the whole catalogue, keyed by id for o(1) lookup.
let metaPromise = null;

function loadMeta () {
  return metaPromise ??= importFile(DATA_URL).then(list =>
    new Map(list.map(entry => [entry.id, entry]))
  );
}

async function metaFor (id) {
  const meta = (await loadMeta()).get(id);
  if (!meta) throw new Error(`[@aufbau/patterns] unknown pattern "${id}"`);
  return meta;
}

// :::::: RAW SVG :::::::::::::::::::::::::::::::::::::::::::::::::

// raw svg strings, cached per id. used by both modes: data-uri substitutes into
// the string, defs parses it into a live node.
const rawCache = new Map;

function loadRaw (id) {
  if (!rawCache.has(id)) {
    const url = import.meta.resolve(`${SVG_SPECIFIER}${id}.svg`);
    rawCache.set(id, importFile(url, 'raw'));
  }
  return rawCache.get(id);
}

// :::::: OPTION RESOLUTION ::::::::::::::::::::::::::::::::::::::

// merges user options over the declared defaults, dropping unknown keys with a
// warning so a typo never silently does nothing.
function resolveVars (meta, options = {}) {
  const out = {};
  for (const [key, spec] of Object.entries(meta.vars)) {
    out[key] = options[key] ?? spec.default;
  }
  for (const key of Object.keys(options)) {
    if (!(key in meta.vars)) {
      console.warn(`[@aufbau/patterns] "${meta.id}" has no option "${key}"`);
    }
  }
  return out;
}

// :::::: TARGET NORMALISATION :::::::::::::::::::::::::::::::::::

// accepts a selector string, a single element, or a nodelist/array of elements.
function toElements (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(el => el instanceof Element);
  return [];
}

// :::::: DATA-URI MODE :::::::::::::::::::::::::::::::::::::::::::

// replaces every var(--aufbau-pattern-<key>, fallback) with the resolved value,
// so the encoded svg is fully static — css vars do not resolve inside a
// background-image document.
function inlineVars (svg, vars) {
  return svg.replace(
    /var\(\s*--aufbau-pattern-([\w-]+)\s*(?:,[^)]*)?\)/g,
    (whole, key) => (key in vars ? String(vars[key]) : whole)
  );
}

async function applyDataUri (elements, id, vars) {
  const raw   = await loadRaw(id);
  const svg   = inlineVars(raw, vars);
  const image = `url("${encodeSvg(svg)}")`;
  for (const el of elements) {
    el.style.backgroundImage = image;
    el.dataset.aufbauPattern = id; // marker for removePattern
  }
}

// :::::: DEFS MODE ::::::::::::::::::::::::::::::::::::::::::::::

// one shared, hidden <svg> host in <body> collects every injected <pattern>.
// defs mode keeps the css vars live, so options are written as custom properties
// on each target and inherited into the pattern via var().
function defsHost () {
  let host = document.getElementById(DEFS_HOST_ID);
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.id = DEFS_HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(host);
  }
  return host;
}

// parses the raw file, lifts its <pattern> into the shared host once per id.
async function ensurePattern (id) {
  const host = defsHost();
  if (host.querySelector(`#aufbau-pattern-${id}`)) return;

  const raw  = await loadRaw(id);
  const node = new DOMParser().parseFromString(raw, 'image/svg+xml').querySelector('pattern');
  if (node) host.appendChild(node);
}

async function applyDefs (elements, id, vars) {
  await ensurePattern(id);
  for (const el of elements) {
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(`${PROP_PREFIX}${key}`, String(value));
    }
    el.style.backgroundImage = `url(#aufbau-pattern-${id})`;
    el.dataset.aufbauPattern = id;
  }
}

// :::::: PUBLIC API ::::::::::::::::::::::::::::::::::::::::::::::

/**
 * applies a pattern to one or more targets.
 * @param {string|Element|Iterable<Element>} target selector, element or nodelist
 * @param {string} id pattern id as listed in data.json5
 * @param {Object} [options] per-var overrides, e.g. { bg: 'green', fg: 'yellow' }
 * @param {'datauri'|'defs'} [options.mode='datauri']
 */
export async function setPattern (target, id, options = {}) {
  const { mode = 'datauri', ...userVars } = options;
  const elements = toElements(target);
  if (elements.length === 0) return;

  const meta = await metaFor(id);
  const vars = resolveVars(meta, userVars);

  return mode === 'defs'
    ? applyDefs(elements, id, vars)
    : applyDataUri(elements, id, vars);
}

/**
 * removes a previously applied pattern and its inline custom properties.
 * @param {string|Element|Iterable<Element>} target
 */
export function removePattern (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('background-image');
    // [...el.style] enumerates the inline-set properties, custom props included.
    for (const prop of [...el.style].filter(p => p.startsWith(PROP_PREFIX))) {
      el.style.removeProperty(prop);
    }
    delete el.dataset.aufbauPattern;
  }
}

/** exposes the parsed catalogue for preview pages and tooling. */
export async function list () {
  return [...(await loadMeta()).values()];
}

// baut den fertigen url("data:...")-string für ein pattern. kein dom.
// setPattern nutzt das intern, der stylesheet-skill nutzt es auch.
export async function patternImage (id, options = {}) {
  const meta = await metaFor(id);
  const vars = resolveVars(meta, options);
  const raw  = await loadRaw(id);
  return `url("${encodeSvg(inlineVars(raw, vars))}")`;
}

export default { 
  setPattern, 
  removePattern, 
  list,
};
