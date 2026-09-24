// @aufbau/webfonts
// the handpicked font collection (./data.js). a font is loaded through the
// FontFace api and applied as a custom property, so css decides where it goes.
//
//   await apply('manrope');                              // --aufbau-font on :root
//   await apply('.code', 'jetbrains-mono');              // mono fonts default to --aufbau-font-mono
//   await apply(document.body, 'lexend', { role: 'heading' });
//   await update(':root', { fallback: 'system-ui' });
//   remove(':root', { role: 'heading' });
//
// the target may be left out, it is the root element then. `role` is a key of
// ROLES or any custom property name.

import { fonts } from './data.js';

export const ROLES = {
  body    : '--aufbau-font',
  code    : '--aufbau-font-mono',
  heading : '--aufbau-font-heading',
  mono    : '--aufbau-font-mono',
  sans    : '--aufbau-font-sans',
  serif   : '--aufbau-font-serif',
};

const settings = { baseUrl: 'https://code.pulgasari.dev/aufbau/webfonts' };

const applied = new WeakMap;   // element -> Map(property -> { id, options })
const loading = new Map;       // id -> promise of the load result

const propertyOf = role => role.startsWith('--') ? role : ROLES[role] ?? `--aufbau-font-${role}`;

function toElements (target) {
  if (target == null)             return [document.documentElement];
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(element => element instanceof Element);
  return [];
}

/** finds a font by id or name */
export const find = key => key ? fonts.find(font => font.id === key || font.name === key) ?? null : null;

// :::::: FONT ::::::::::::::::::::::::::::::::::::::::::::::::::

export class Font {
  constructor (id, options = {}) {
    this.meta = find(id);
    if (!this.meta) throw new Error(`[@aufbau/webfonts] unknown font "${id}"`);
    this.id      = this.meta.id;
    this.options = options;
  }

  get role () { return this.options.role ?? (this.meta.category === 'mono' ? 'mono' : 'body'); }

  /** the font-family value, the font plus its fallback */
  family (options) {
    const fallback = { ...this.options, ...options }.fallback ?? this.meta.fallback ?? 'sans-serif';
    return `'${this.meta.name}', ${fallback}`;
  }

  /** registers every face with document.fonts once. resolves false when none loaded */
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

export const data = fonts;
export const list = () => fonts.map(({ category, id, name }) => ({ category, id, name }));

export const configure = ({ baseUrl } = {}) => { if (baseUrl) settings.baseUrl = baseUrl.replace(/\/$/, ''); };

export const use  = (id, options) => new Font(id, options);
export const load = id => use(id).load();

/** apply(target, id, options), or apply(id, options) for the root element */
export const apply = (target, id, options) =>
  typeof id === 'string' ? use(id).apply(target, options) : use(target).apply(null, id);

/** changes the options of the fonts already on the targets, `role` narrows it to one */
export async function update (target, options = {}) {
  const only = options.role && propertyOf(options.role);
  const jobs = [];
  for (const element of toElements(target)) {
    for (const [property, state] of applied.get(element) ?? []) {
      if (!only || only === property) jobs.push(use(state.id).apply(element, { ...state.options, ...options, role: property }));
    }
  }
  await Promise.all(jobs);
}

/** removes the fonts set on the targets, `role` narrows it to one */
export function remove (target, { role } = {}) {
  const only = role && propertyOf(role);
  for (const element of toElements(target)) {
    const properties = applied.get(element);
    for (const property of [...properties?.keys() ?? []]) {
      if (only && only !== property) continue;
      element.style.removeProperty(property);
      properties.delete(property);
    }
  }
}

/** loads and applies a list of fonts to the root: ['manrope', { id: 'lexend', role: 'heading' }] */
export async function init (config) {
  if (!config) return;
  const items = (Array.isArray(config) ? config : [config]).map(item => typeof item === 'string' ? { id: item } : item);
  await Promise.all(items.map(({ id, target, ...options }) => apply(target ?? null, id, options)));
}

export { find as findFont, fonts };

export default { apply, configure, data, find, fonts, init, list, load, remove, update, use, Font, ROLES };
