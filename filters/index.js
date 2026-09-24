// @aufbau/filters
// image effects with several backends: css, svg, canvas (imageData or the
// ctx.filter bridge) and webgl. every filter is a module in ./lib, the metadata
// lives in ./manifest.js so the catalogue is cheap and the implementations load
// on first use.
//
//   await apply('#logo', 'glitch-rgb', { offsetX: 6 });
//   await update('#logo', { offsetX: 12 });
//   remove('#logo');
//
//   const blur = use('blur', { amount: 4 });
//   await blur.css();                // "blur(4px)"
//   await blur.canvas(canvasElement);
//
// on elements a filter is css when it has a css backend, an injected svg
// <filter> otherwise (`backend: 'css' | 'svg'` forces one). canvas and webgl
// only work on a <canvas>, see canvas() and createPipeline().

import { PREFIX, defsHost, svgId, toElements } from './core.js';
import { backendsOf, load, manifest, metaOf }  from './lib/registry.js';
import { filterToCanvas }                      from './canvas.js';
import { filterChainWebgl, filterToWebgl }     from './webgl.js';
import { createPipeline }                      from './pipeline.js';

const applied = new WeakMap;   // element -> { id, options }

// baked geometry and booleans change the markup, not a value. each distinct
// combination needs its own injected <filter>
function variantId (id, meta, options) {
  const structural = Object.entries(meta.vars).filter(([key, spec]) =>
    (spec.bake || spec.type === 'boolean') && options[key] != null && String(options[key]) !== String(spec.default)
  );
  if (!structural.length) return svgId(id);
  return `${svgId(id)}-${structural.map(([key]) => `${key}-${String(options[key]).replace(/[^\w-]/g, '')}`).join('-')}`;
}

// only live vars ride on custom properties, the rest is baked into the variant
const isLive = spec => !spec.bake && spec.type !== 'boolean';

// :::::: FILTER ::::::::::::::::::::::::::::::::::::::::::::::::

export class Filter {
  constructor (id, options = {}) {
    this.meta    = metaOf(id);
    this.id      = id;
    this.options = options;
  }

  get backends () { return backendsOf(this.meta); }
  get url      () { return `url(#${svgId(this.id)})`; }

  #merge (options) { const { backend, ...rest } = { ...this.options, ...options }; return rest; }

  /** the native css filter function, or null without a css backend */
  async css (options) {
    const { css } = await load(this.id);
    return css ? css(this.#merge(options)) : null;
  }

  /** the <filter> markup. `live: true` gives the var() driven form */
  async svg (options) {
    const { render } = await load(this.id);
    if (!render) throw new Error(`[@aufbau/filters] "${this.id}" has no svg backend`);
    return render(this.#merge(options));
  }

  /** injects the live <filter> into the shared defs host once, returns its id */
  async ensure (options) {
    const merged    = this.#merge(options);
    const elementId = merged.svgId ?? variantId(this.id, this.meta, merged);
    const host      = defsHost();
    if (host.querySelector(`#${CSS.escape(elementId)}`)) return elementId;

    const markup = await this.svg({ live: true, ...merged, svgId: elementId });
    const node   = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml').querySelector('filter');
    if (node) host.appendChild(node);
    return elementId;
  }

  /** filters a canvas in place, `backend: 'imagedata' | 'bridge' | 'webgl'` forces one */
  canvas (canvas, options) { return filterToCanvas(canvas, this.id, { ...this.options, ...options }); }
  webgl  (canvas, options) { return filterToWebgl (canvas, this.id, { ...this.options, ...options }); }

  async apply (target, options) {
    const elements = toElements(target);
    if (!elements.length) return this;

    const { backend = 'auto', ...merged } = { ...this.options, ...options };
    const css = backend === 'svg' ? null : await this.css(merged);

    if (css) {
      for (const element of elements) this.#paint(element, css, { backend, ...merged });
      return this;
    }
    if (backend === 'css') return this;

    const url = `url(#${await this.ensure(merged)})`;
    for (const element of elements) {
      for (const [key, spec] of Object.entries(this.meta.vars)) {
        if (isLive(spec) && merged[key] != null) element.style.setProperty(PREFIX + key, String(merged[key]));
      }
      this.#paint(element, url, { backend, ...merged });
    }
    return this;
  }

  #paint (element, value, options) {
    element.style.filter         = value;
    element.dataset.aufbauFilter = this.id;
    applied.set(element, { id: this.id, options });
  }

  remove (target) { remove(target); return this; }
}

// :::::: API :::::::::::::::::::::::::::::::::::::::::::::::::::

export const list = () => Object.values(manifest).map(meta => ({ id: meta.id, name: meta.name, vars: meta.vars, backends: backendsOf(meta) }));
export const data = list();

export const supports = id => backendsOf(metaOf(id));

export const use = (id, options) => new Filter(id, options);

export const apply = (target, id, options) => use(id).apply(target, options);

/** changes the options of the filter already on the targets */
export async function update (target, options = {}) {
  await Promise.all(toElements(target).map(element => {
    const state = applied.get(element);
    return state && apply(element, state.id, { ...state.options, ...options });
  }));
}

export function remove (target) {
  for (const element of toElements(target)) {
    if (!applied.has(element) && !element.dataset.aufbauFilter) continue;
    element.style.removeProperty('filter');
    for (const property of [...element.style].filter(name => name.startsWith(PREFIX))) element.style.removeProperty(property);
    delete element.dataset.aufbauFilter;
    applied.delete(element);
  }
}

// the render paths without a Filter around it
export const ensureFilter     = (id, options) => use(id).ensure(options);
export const filterCanvas     = (canvas, id, options) => use(id).canvas(canvas, options);
export const filterCss        = (id, options) => use(id).css(options);
export const filterSvg        = (id, options) => use(id).svg(options);
export const filterWebgl      = (canvas, id, options) => use(id).webgl(canvas, options);
export const filterWebglChain = filterChainWebgl;

export { createPipeline, load, manifest };

export {
  apply  as applyFilter,
  remove as removeFilter,
  update as updateFilter,
  use    as useFilter,
};

export default { apply, createPipeline, data, list, load, manifest, remove, supports, update, use, Filter };
