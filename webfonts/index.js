// @aufbau/webfonts

// :::::: IMPORTS

import { isArray, isElement, isFn, isIterable, isNullish, isString } from '@pulgasari/is';
import { fonts } from './data.js';

// :::::: 

const ROLES = {
  body    : '--aufbau-font',
  code    : '--aufbau-font-mono',
  heading : '--aufbau-font-heading',
  mono    : '--aufbau-font-mono',
  sans    : '--aufbau-font-sans',
  serif   : '--aufbau-font-serif',
};

const settings = { baseUrl: 'https://code.pulgasari.dev/aufbau/webfonts' };
const applied  = new WeakMap; // element -> Map(property -> { id, options })
const loading  = new Map;     // id -> promise of the load result

const propertyOf = role => role.startsWith('--') ? role : ROLES[role] ?? `--aufbau-font-${role}`;

function toElements (target) {
  if (isNullish  (target)) return [document.documentElement];
  if (isString   (target)) return [...document.querySelectorAll(target)];
  if (isElement  (target)) return [target]; // target instanceof Element
  if (isIterable (target)) return [...target].filter(isElement);
  return [];
}

const find = key => key ? fonts.find(font => font.id === key || font.name === key) ?? null : null;

// :::::: FONT ::::::::::::::::::::::::::::::::::::::::::::::::::

class Font {
  constructor (id, options = {}) {
    this.meta = find(id);
    if (!this.meta) throw new Error(`[@aufbau/webfonts] unknown font "${id}"`);
    this.id      = this.meta.id;
    this.options = options;
  }

  get role () { return this.options.role ?? (this.meta.category === 'mono' ? 'mono' : 'body'); }

  family (options) {
    const fallback = { ...this.options, ...options }.fallback ?? this.meta.fallback ?? 'sans-serif';
    return `'${this.meta.name}', ${fallback}`;
  }

  load () {
    if (!loading.has(this.id)) loading.set(this.id, Promise.all(this.meta.faces.map(async face => {
      const url = /^https?:\/\//.test(face.file) ? face.file : `${settings.baseUrl}/${face.file}`;
      try {
        const loaded = await new FontFace(this.meta.name, `url(${url})`, { display: face.display ?? 'swap', style: face.style ?? 'normal', weight: String(face.weight ?? 400) }).load();
        document.fonts.add(loaded);
        return true;
      } catch (error) {
        console.warn(`[@aufbau/webfonts] failed to load a face of "${this.meta.name}":`, error);
        return false;
      }
    })).then(results => results.some(Boolean)));

    return loading.get(this.id);
  }

  // the property is set even when loading failed, the fallback takes over then
  async apply (target, options) {
    const merged   = { ...this.options, ...options };
    const property = propertyOf(merged.role ?? this.role);
    await this.load();

    for (const element of toElements(target)) {
      element.style.setProperty(property, this.family(merged));
      if (!applied.has(element)) applied.set(element, new Map);
      applied.get(element).set(property, { id: this.id, options: merged });
    }
    return this;
  }

  remove (target, options) { remove(target, { role: this.role, ...options }); return this; }
}

// :::::: API :::::::::::::::::::::::::::::::::::::::::::::::::::

const data = fonts;
const list = () => fonts.map(({ category, id, name }) => ({ category, id, name }));

const configure = ({ baseUrl } = {}) => { if (baseUrl) settings.baseUrl = baseUrl.replace(/\/$/, ''); };

const use  = (id, options) => new Font (id, options);
const load = (id)          => use(id).load();

const apply = (target, id, options) =>
  isString(id) ? use(id).apply(target, options) : use(target).apply(null, id);

async function update (target, options = {}) {
  const only = options.role && propertyOf(options.role);
  const jobs = [];
  for (const element of toElements(target)) {
    for (const [property, state] of applied.get(element) ?? []) {
      if (!only || only === property) jobs.push(use(state.id).apply(element, { ...state.options, ...options, role: property }));
    }
  }
  await Promise.all(jobs);
}

function remove (target, { role } = {}) {
  const only = role && propertyOf(role);
  for (const element of toElements(target)) {
    const props = applied.get(element);
    const keys  = [...props?.keys() ?? []]
    for (const property of keys) {
      if (only && only !== prop) continue;
      element.style.removeProperty(prop);
      props.delete(prop);
    }
  }
}

async function init (config) {
  if (!config) return;
  const items = (isArray(config) ? config : [config]).map(item => isString(item) ? { id: item } : item);
  await Promise.all(items.map(({ id, target, ...options }) => apply(target ?? null, id, options)));
}

export         { find as findFont };
export         { apply, configure, data, find, fonts, init, list, load, remove, update, use, Font, ROLES };
export default { apply, configure, data, find, fonts, init, list, load, remove, update, use, Font, ROLES };
