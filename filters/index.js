// @aufbau/filters
// filters are js functions that generate svg. each one is importable on its own
// (`import blur from '@aufbau/filters/blur'`); this barrel adds the catalogue plus
// the dom api that @aufbau/stylesheet and @aufbau/stylescript build on.
//
// filters, unlike patterns, are inherently defs-based: css `filter: url(#id)` only
// resolves against a <filter> living in the document. there is no data-uri
// equivalent that filters the host element, so there is no data-uri mode here.

import { PREFIX, defsHost, resolve, svgId, toElements } from './core.js';
import { filters } from './lib/index.js';

// :::::: CATALOGUE ::::::::::::::::::::::::::::::::::::::::::::::

function metaFor (id) {
  const meta = filters[id];
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  return meta;
}

// parsed catalogue for preview pages and tooling. render is dropped; callers that
// want markup go through filterSvg (or import the module directly).
export function list () {
  return Object.values(filters).map(({ id, name, vars }) => ({ id, name, vars }));
}

// :::::: SVG BUILDING :::::::::::::::::::::::::::::::::::::::::::

// the <filter> markup for an id. baked by default; pass { live: true } for the
// var()-driven form used by defs injection and the static assets.
export function filterSvg (id, options = {}) {
  return metaFor(id).render(options);
}

// :::::: DEFS INJECTION :::::::::::::::::::::::::::::::::::::::::

// structural options — baked geometry or a boolean like `animate` — change the
// markup's topology, so they cannot ride on a live custom property; each distinct
// combination needs its own injected element. builds a stable id suffix for the
// non-default ones so variants coexist in the host.
function variantId (id, meta, options) {
  const structural = Object.entries(meta.vars).filter(([key, spec]) =>
    (spec.bake || spec.type === 'boolean') && options[key] != null && String(options[key]) !== String(spec.default)
  );
  if (structural.length === 0) return svgId(id);
  const suffix = structural.map(([key]) => `${key}-${String(options[key]).replace(/[^\w-]/g, '')}`).join('-');
  return `${svgId(id)}-${suffix}`;
}

// injects a filter's <filter> into the shared host once, without touching any
// target. the stylesheet skill calls this so a compiled `filter: url(#id)` has its
// definition present. defaults to the live form so custom properties stay in play;
// non-default structural options get their own variant element.
export async function ensureFilter (id, options = {}) {
  const host      = defsHost();
  const elementId = options.svgId ?? variantId(id, metaFor(id), options);
  if (host.querySelector(`#${CSS.escape(elementId)}`)) return elementId;

  const markup = filterSvg(id, { live: true, ...options, svgId: elementId });
  const doc    = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
  const node   = doc.querySelector('filter');
  if (node) host.appendChild(node);
  return elementId;
}

// :::::: PUBLIC API ::::::::::::::::::::::::::::::::::::::::::::::

// applies a filter to one or more targets via css `filter: url(#id)`. only the
// options a caller actually passes are written as inherited custom properties; the
// rest fall back to the defaults baked into the injected <filter>.
export function applyFilter (target, id, options = {}) {
  const elements = toElements(target);
  if (elements.length === 0) return;
  const meta      = metaFor(id);
  const elementId = variantId(id, meta, options);
  ensureFilter(id, { ...options, svgId: elementId });

  const url = `url(#${elementId})`;
  for (const el of elements) {
    // only live (non-baked, non-boolean) options ride on custom properties; the
    // structural ones are already baked into the variant element above.
    for (const key in meta.vars) {
      const spec = meta.vars[key];
      if (!spec.bake && spec.type !== 'boolean' && options[key] != null) {
        el.style.setProperty(`${PREFIX}${key}`, String(options[key]));
      }
    }
    el.style.filter = url;
    el.dataset.aufbauFilter = id;
  }
}

// removes a previously applied filter and its inline custom properties.
export function removeFilter (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('filter');
    for (const prop of [...el.style].filter(p => p.startsWith(PREFIX))) el.style.removeProperty(prop);
    delete el.dataset.aufbauFilter;
  }
}

// binds one filter + option set into a small handle, handy for stylescript and
// component code: `const glitch = useFilter('glitch-rgb', { offsetX: 6 })`.
export function useFilter (id, options = {}) {
  const elementId = svgId(id);
  return {
    id,
    css    : `filter: url(#${elementId});`,
    ensure : () => ensureFilter(id, options),
    apply  : target => applyFilter(target, id, options),
    remove : target => removeFilter(target),
    svg    : (opts = options) => filterSvg(id, opts),
  };
}

export { filters };

export default { applyFilter, ensureFilter, filterSvg, filters, list, removeFilter, useFilter };
