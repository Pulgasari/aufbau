// @aufbau/api

import { deepMerge } from '@pulgasari/obj';
import { CSS_PATH, gestalt } from './gestalt.js';

// :::::: LAZY HELPERS :::::::::::::::::::::::::::::::::::::::::

const CONTRACT = ['apply', 'list', 'load', 'remove', 'update', 'use'];

/** Ensures a module import function is executed only once (memoized promise). */
const once = (load) => {
  let promise;
  return () => (promise ??= load());
};

/** Lazily invokes a method on a dynamically imported module. */
const lazy = (load, method) => async (...args) => (await load())[method](...args);

/** Generates an object of lazy-loaded module methods. */
const facade = (load, names) =>
  Object.fromEntries(names.map((name) => [name, lazy(load, name)]));

// :::::: MODULE REGISTRY ::::::::::::::::::::::::::::::::::::::

const modules = {
  config   : once(() => import('@aufbau/element')),
  domina   : (name)  => import(`@domina/methods/${name}.js`).then((m) => m[name] ?? m.default),
  elements : once(() => import('@aufbau/elements')),
  filters  : once(() => import('@aufbau/filters')),
  icons    : once(() => import('@aufbau/svg/aliases.js')),
  patterns : once(() => import('@aufbau/patterns')),
  webfonts : once(() => import('@aufbau/webfonts')),
};

// :::::: NAMESPACES & FACADES :::::::::::::::::::::::::::::::::

const filters  = facade(modules.filters, [...CONTRACT, 'createPipeline', 'supports']);
const patterns = facade(modules.patterns, CONTRACT);
const webfonts = facade(modules.webfonts, [...CONTRACT, 'configure', 'init']);

const elements = {
  getConfig      : lazy(modules.config, 'getConfig'),
  setConfig      : lazy(modules.config, 'setConfig'),
  enableAutoload : lazy(modules.elements, 'autoloader'),
  load           : lazy(modules.elements, 'load'),
  registerAll    : lazy(modules.elements, 'registerAll'),
};

const domCall = (method) => async (...args) => (await modules.domina(method))(...args);

const dom = {
  adoptStylesheet : domCall('adoptStylesheet'),
  getStyleToken   : domCall('getStyleToken'),
  setStyleToken   : domCall('setStyleToken'),
};

// Helper for lazy module property accessors
const fetchProp = (load, prop = 'data') => load().then((m) => m[prop]);

const data = {
  get filters()  { return fetchProp(modules.filters); },
  get icons()    { return fetchProp(modules.icons, 'default'); },
  get palettes() { return gestalt.palettes(); },
  get patterns() { return fetchProp(modules.patterns); },
  get themes()   { return gestalt.themes(); },
  get webfonts() { return fetchProp(modules.webfonts); },
};

// :::::: COMBINED OPERATIONS ::::::::::::::::::::::::::::::::::

const KINDS = { filter: filters, font: webfonts, pattern: patterns };

const kindOf = (key) => {
  const target = KINDS[key];
  if (!target) {
    throw new Error(`[@aufbau/api] unknown kind "${key}", expected ${Object.keys(KINDS).join(', ')}`);
  }
  return target;
};

/** Normalizes string, array, or object input into [id, options] */
const entryOf = (value) => {
  if (typeof value === 'string') return [value, {}];
  if (Array.isArray(value)) return [value[0], value[1] ?? {}];
  const { id, ...options } = value;
  return [id, options];
};

/** Applies several kinds at once; passing null removes a kind. */
const apply = (target, spec = {}) =>
  Promise.all(
    Object.entries(spec).map(([key, value]) =>
      value == null
        ? kindOf(key).remove(target)
        : kindOf(key).apply(target, ...entryOf(value))
    )
  );

/** Changes options of already applied kinds. */
const update = (target, spec = {}) =>
  Promise.all(
    Object.entries(spec).map(([key, options]) => kindOf(key).update(target, options))
  );

/** Removes specified kinds (or all by default). */
const remove = (target, keys = Object.keys(KINDS)) =>
  Promise.all(keys.map((key) => kindOf(key).remove(target)));

// :::::: CONFIG & BOOT :::::::::::::::::::::::::::::::::::::::::

const config = {
  css: {
    layout  : false,
    look    : 'flat',
    mode    : null,
    palette : null,
    reset   : true,
    skin    : 'monochrome',
    theme   : 'zombie',
  },
  elements: {
    mode : 'auto',
  },
  font: ['manrope'],
};

function linkStylesheet(href) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement('link'), {
      href,
      rel: 'stylesheet',
      onload: resolve,
      onerror: reject,
    });
    document.head.prepend(link);
  });
}

let booted = false;

const setConfig = (options = {}) => deepMerge(config, options);

async function boot(options = {}) {
  setConfig(options);
  if (booted || typeof window === 'undefined') return booted;
  booted = true;

  const {
    css: { layout, look, mode: scheme, palette, reset, skin, theme },
    elements: { mode, ...defaults },
    font,
  } = config;

  if (reset) await linkStylesheet(`${CSS_PATH}/aufbau.css`);
  if (Object.keys(defaults).length) await elements.setConfig(defaults);

  await Promise.all([
    gestalt.set({ layout, look, mode: scheme, skin, theme, ...(palette && { palette }) }),
    mode === 'auto' && elements.enableAutoload(),
    mode === 'all'  && elements.registerAll(),
    font && webfonts.init(font),
  ]);

  return booted;
}

// :::::: EXPORTS :::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  apply,
  boot,
  config,
  data,
  dom,
  elements,
  filters,
  gestalt,
  patterns,
  remove,
  setConfig,
  update,
  webfonts,
};

export {
  apply,
  boot,
  config,
  data,
  dom,
  elements,
  filters,
  gestalt,
  patterns,
  remove,
  setConfig,
  update,
  webfonts,
};

export default aufbau;
