// @aufbau/filters/index.js

import { importFile } from '@aufbau/import';

// filters, unlike patterns, are inherently defs-based: css `filter: url(#id)`
// only resolves against a <filter> living in the document. there is no
// data-uri equivalent that filters the host element, so no mode switch here.

const SVG_SPECIFIER = '@aufbau/svg/filters/';
const DATA_URL      = import.meta.resolve(SVG_SPECIFIER + 'data.json5');

const PROP_PREFIX  = '--aufbau-filter-';
const DEFS_HOST_ID = 'aufbau-filter-defs';

// :::::: METADATA :::::::::::::::::::::::::::::::::::::::::::::::

let metaPromise = null;

function loadMeta () {
  return metaPromise ??= importFile(DATA_URL).then(list =>
    new Map(list.map(entry => [entry.id, entry]))
  );
}

async function metaFor (id) {
  const meta = (await loadMeta()).get(id);
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  return meta;
}

// :::::: RAW SVG :::::::::::::::::::::::::::::::::::::::::::::::::

const rawCache = new Map();

function loadRaw (id) {
  if (!rawCache.has(id)) {
    const url = import.meta.resolve(`${SVG_SPECIFIER}${id}.svg`);
    rawCache.set(id, importFile(url, 'raw'));
  }
  return rawCache.get(id);
}

// :::::: OPTION RESOLUTION ::::::::::::::::::::::::::::::::::::::

function resolveVars (meta, options = {}) {
  const out = {};
  for (const [key, spec] of Object.entries(meta.vars)) {
    out[key] = options[key] ?? spec.default;
  }
  for (const key of Object.keys(options)) {
    if (!(key in meta.vars)) {
      console.warn(`[@aufbau/filters] "${meta.id}" has no option "${key}"`);
    }
  }
  return out;
}

// :::::: TARGET NORMALISATION :::::::::::::::::::::::::::::::::::

function toElements (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(el => el instanceof Element);
  return [];
}

// :::::: DEFS INJECTION ::::::::::::::::::::::::::::::::::::::::::

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

/**
 * injects a filter's <defs> into the shared host once, without touching any
 * target element. the stylesheet skill calls this so a compiled `filter: url(#id)`
 * has its definition present in the dom.
 * @param {string} id filter id as listed in data.json5
 */
export async function ensureFilter (id) {
  const host = defsHost();
  if (host.querySelector(`#aufbau-filter-${id}`)) return;

  const raw  = await loadRaw(id);
  const node = new DOMParser().parseFromString(raw, 'image/svg+xml').querySelector('filter');
  if (node) host.appendChild(node);
}

// :::::: PUBLIC API ::::::::::::::::::::::::::::::::::::::::::::::

/**
 * applies a filter to one or more targets via css `filter: url(#id)`.
 * options are written as inherited custom properties, so the filter primitives
 * pick them up live through var().
 * @param {string|Element|Iterable<Element>} target selector, element or nodelist
 * @param {string} id filter id as listed in data.json5
 * @param {Object} [options] per-var overrides, e.g. { amount: 4 }
 */
export async function setFilter (target, id, options = {}) {
  const elements = toElements(target);
  if (elements.length === 0) return;

  const meta = await metaFor(id);
  const vars = resolveVars(meta, options);

  await ensureFilter(id);
  for (const el of elements) {
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(`${PROP_PREFIX}${key}`, String(value));
    }
    el.style.filter = `url(#aufbau-filter-${id})`;
    el.dataset.aufbauFilter = id;
  }
}

/**
 * removes a previously applied filter and its inline custom properties.
 * @param {string|Element|Iterable<Element>} target
 */
export function removeFilter (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('filter');
    for (const prop of [...el.style].filter(p => p.startsWith(PROP_PREFIX))) {
      el.style.removeProperty(prop);
    }
    delete el.dataset.aufbauFilter;
  }
}

/** exposes the parsed catalogue for preview pages and tooling. */
export async function list () {
  return [...(await loadMeta()).values()];
}

export default { setFilter, removeFilter, list };
