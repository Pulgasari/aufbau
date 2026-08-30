// @aufbau/filters
// filters are js functions that generate svg. each one is importable on its own
// (`import blur from '@aufbau/filters/blur'`); this barrel adds the catalogue plus
// the dom api that @aufbau/stylesheet and @aufbau/stylescript build on.
//
// filters, unlike patterns, are inherently defs-based: css `filter: url(#id)` only
// resolves against a <filter> living in the document. there is no data-uri
// equivalent that filters the host element, so there is no data-uri mode here.

import { PREFIX, defsHost, resolve, svgId, toElements } from './core.js';
import { filters, backendsOf } from './lib/index.js';
import { filterToCanvas } from './canvas.js';
import { filterToWebgl, filterChainWebgl } from './webgl.js';
import { createPipeline } from './pipeline.js';



// runs several webgl filters as one gpu-resident chain (no 2d round-trip between them).
const filterWebglChain = filterChainWebgl;

// applies a filter to a <canvas> in place — imageData backend when the filter has one,
// the ctx.filter bridge (css string, or a baked svg <filter>) for css/svg filters, or
// the webgl backend for filters that only have one. the universal canvas entry point.
const filterCanvas = filterToCanvas;

// runs a filter's webgl backend on a canvas in place (fisheye, mirror, kaleidoscope, zoom-blur).
// filterCanvas delegates here for webgl-only filters.
const filterWebgl = filterToWebgl;

// :::::: CATALOGUE ::::::::::::::::::::::::::::::::::::::::::::::

function metaFor (id) {
  const meta = filters[id];
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  return meta;
}

// parsed catalogue for preview pages and tooling. render is dropped; callers that
// want markup go through filterSvg (or import the module directly).
function list () {
  return Object.values(filters).map(meta => ({
    id: meta.id, name: meta.name, vars: meta.vars, backends: backendsOf(meta),
  }));
}

const data = list();

// :::::: SVG BUILDING :::::::::::::::::::::::::::::::::::::::::::

// the <filter> markup for an id (svg backend). baked by default; pass { live: true }
// for the var()-driven form used by defs injection and the static assets. throws for
// canvas-only filters (pixelate, dither, …), which have no svg representation.
function filterSvg (id, options = {}) {
  const render = metaFor(id).render;
  if (!render) throw new Error(`[@aufbau/filters] "${id}" has no svg backend (canvas-only)`);
  return render(options);
}

// the native css <filter-function> for an id (css backend), or null when the filter
// has no css equivalent. e.g. filterCss('blur', { amount: 4 }) -> "blur(4px)".
function filterCss (id, options = {}) {
  const fn = metaFor(id).css;
  return fn ? fn(options) : null;
}

// which backends a filter can be realised through. `canvas` is true for a dedicated
// imageData backend or any bridge-able filter (svg/css). webgl lands here later.
function supports (id) {
  return backendsOf(metaFor(id));
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
async function ensureFilter (id, options = {}) {
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

// applies a filter to one or more targets. `backend` selects how:
//   'auto' (default) — native css when the filter has it (cheapest, gpu, animatable),
//                       otherwise the svg defs-injection path.
//   'css'            — force css; no-op if the filter has no css backend.
//   'svg'            — force the svg path even when css is available.
// for the svg path, only the options a caller passes are written as inherited custom
// properties; the rest fall back to the defaults baked into the injected <filter>.
function applyFilter (target, id, options = {}) {
  const { backend = 'auto', ...opts } = options;
  const elements = toElements(target);
  if (elements.length === 0) return;
  const meta = metaFor(id);

  if (meta.css && (backend === 'css' || backend === 'auto')) {
    const value = meta.css(opts);
    if (value) {
      for (const el of elements) { el.style.filter = value; el.dataset.aufbauFilter = id; }
      return;
    }
  }
  if (backend === 'css') return; // explicitly asked for css, but this filter has none

  const elementId = variantId(id, meta, opts);
  ensureFilter(id, { ...opts, svgId: elementId });
  const url = `url(#${elementId})`;
  for (const el of elements) {
    for (const key in meta.vars) {
      const spec = meta.vars[key];
      if (!spec.bake && spec.type !== 'boolean' && opts[key] != null) {
        el.style.setProperty(`${PREFIX}${key}`, String(opts[key]));
      }
    }
    el.style.filter = url;
    el.dataset.aufbauFilter = id;
  }
}

// removes a previously applied filter and its inline custom properties.
function removeFilter (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('filter');
    for (const prop of [...el.style].filter(p => p.startsWith(PREFIX))) el.style.removeProperty(prop);
    delete el.dataset.aufbauFilter;
  }
}

// binds one filter + option set into a small, backend-aware handle, handy for
// stylescript and component code: `const glitch = useFilter('glitch-rgb', { offsetX: 6 })`.
function useFilter (id, options = {}) {
  return {
    id,
    url      : `url(#${svgId(id)})`,                    // the svg reference
    css      : (opts = options) => filterCss(id, opts), // native css filter-function, or null
    svg      : (opts = options) => filterSvg(id, opts), // <filter> markup
    supports : () => supports(id),
    ensure   : () => ensureFilter(id, options),
    apply    : (target, opts = options) => applyFilter(target, id, opts),
    remove   : target => removeFilter(target),
  };
}

export {
  applyFilter,
  createPipeline, // non-destructive filter stack for editor-style use — see pipeline.js.
  data,
  ensureFilter,
  filters,
  filterCanvas,
  filterCss,
  filterSvg,
  filterWebgl,
  filterWebglChain,
  list,
  removeFilter,
  supports,
  useFilter,
};

export default {
  applyFilter,
  createPipeline,
  data,
  ensureFilter,
  filters,
  filterCanvas,
  filterCss, 
  filterSvg, 
  filterWebgl,
  filterWebglChain, 
  list, 
  removeFilter,
  supports,
  useFilter,
};
