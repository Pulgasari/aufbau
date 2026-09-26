// @aufbau/patterns
// tileable svg patterns, painted as a data-uri background-image. every pattern
// is a plain function in ./lib, the metadata lives in ./manifest.js so the
// catalogue is cheap and the implementations load on first use.
//
//   await apply('.box', 'dots', { fg: '#f00', motion: 'up', speed: '12s' });
//   await update('.box', { fg: '#0f0' });
//   remove('.box');
//
//   const dots = use('dots', { fg: '#f00' });
//   await dots.image();   // url("data:…")
//   await dots.apply('.box');
//
// options: the pattern's vars (see list()), plus motion, speed and timing.

import { encodeSvg, toElements } from './core.js';
import { manifest }              from './manifest.js';
import { DIRECTIONS, Motion }    from './motion.js';

const MOTION_KEYS = ['motion', 'speed', 'timing'];

const applied = new WeakMap;   // element -> { id, options }
const modules = new Map;       // id -> promise of the render function

function metaOf (id) {
  const meta = manifest[id];
  if (!meta) throw new Error(`[@aufbau/patterns] unknown pattern "${id}"`);
  return meta;
}

const split = (options) => {
  const vars = { ...options }, motion = {};
  for (const key of MOTION_KEYS) { motion[key] = vars[key]; delete vars[key]; }
  return [vars, motion];
};

// :::::: PATTERN :::::::::::::::::::::::::::::::::::::::::::::::

export class Pattern {
  constructor (id, options = {}) {
    this.meta    = metaOf(id);
    this.id      = id;
    this.options = options;
  }

  /** the full <svg> tile. `live: true` gives the var() driven form of the static assets */
  async svg (options) {
    const [vars] = split({ ...this.options, ...options });
    return (await load(this.id))(vars);
  }

  async image (options) { return `url("${encodeSvg(await this.svg(options))}")`; }
  async css   (options) { return `background-image: ${await this.image(options)};`; }

  async apply (target, options) {
    const elements = toElements(target);
    if (!elements.length) return this;

    const merged = { ...this.options, ...options };
    const [, { motion, speed, timing }] = split(merged);
    const image = await this.image(merged);

    for (const element of elements) {
      element.style.backgroundImage = image;
      element.dataset.aufbauPattern = this.id;
      applied.set(element, { id: this.id, options: merged });
    }

    if (motion) new Motion(motion, { size: merged.size ?? this.meta.vars.size?.default, speed, timing }).apply(elements);
    else Motion.stop(elements);

    return this;
  }

  remove (target) { remove(target); return this; }
}

// :::::: API :::::::::::::::::::::::::::::::::::::::::::::::::::

/** the render function of a pattern, imported once */
export function load (id) {
  metaOf(id);
  if (!modules.has(id)) modules.set(id, import(`./lib/${id}.js`).then(module => module.default));
  return modules.get(id);
}

export const list = () => Object.values(manifest).map(({ id, name, vars }) => ({ id, name, vars }));
export const data = list();

export const use = (id, options) => new Pattern(id, options);

export const apply = (target, id, options) => use(id).apply(target, options);

/** changes the options of the pattern already on the targets */
export async function update (target, options = {}) {
  await Promise.all(toElements(target).map(element => {
    const state = applied.get(element);
    return state && apply(element, state.id, { ...state.options, ...options });
  }));
}

export function remove (target) {
  const elements = toElements(target);
  Motion.stop(elements);
  for (const element of elements) {
    if (!applied.has(element) && !element.dataset.aufbauPattern) continue;
    element.style.removeProperty('background-image');
    delete element.dataset.aufbauPattern;
    applied.delete(element);
  }
}

// the render path without a Pattern around it, for the aufbau-pattern skill parked in ass/_stylesheet
export const patternSvg   = (id, options) => use(id).svg(options);
export const patternImage = (id, options) => use(id).image(options);

export { DIRECTIONS, Motion, manifest };

export {
  apply  as applyPattern,
  remove as removePattern,
  update as updatePattern,
  use    as usePattern,
};

export default { apply, data, list, load, manifest, remove, update, use, Motion, Pattern };
