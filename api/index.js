// @aufbau/api

import { deepMerge } from '@pulgasari/obj';
import { shift }     from '@pulgasari/shapeshift
  
import { CSS_PATH, gestalt } from './gestalt.js';

// :::::: LAZY ::::::::::::::::::::::::::::::::::::::::::::::::::

const CONTRACT = ['apply', 'list', 'load', 'remove', 'update', 'use'];
const facade   = (load, names) => Object.fromEntries(names.map(name => [name, async (...args) => (await load())[name](...args)]));
const once     = (load)        => { let promise; return () => promise ??= load(); };

const modules = {
  config   : once(() => import('@aufbau/elements/core/AufbauConfig.js')),
  domina   : name    => import(`@domina/methods/${name}.js`).then(module => module[name] ?? module.default),
  elements : once(() => import('@aufbau/elements')),
  filters  : once(() => import('@aufbau/filters')),
  icons    : once(() => import('@aufbau/icons/aliases.js')),
  patterns : once(() => import('@aufbau/patterns')),
  webfonts : once(() => import('@aufbau/webfonts')),
//$load    : (name)  => modules[name]().then(module => module.data),
};

// :::::: NAMESPACES ::::::::::::::::::::::::::::::::::::::::::::

const filters  = facade(modules.filters , [...CONTRACT, 'createPipeline', 'supports']);
const patterns = facade(modules.patterns, CONTRACT);
const webfonts = facade(modules.webfonts, [...CONTRACT, 'configure', 'init']);

const elements = {
  getConfig      : async (...args) => (await modules.config()).getConfig(...args),
  setConfig      : async (...args) => (await modules.config()).setConfig(...args),
  
  enableAutoload : async (options) => (await modules.elements()).autoloader(options),
  load           : async (tag)     => (await modules.elements()).load(tag),
  registerAll    : async ()        => (await modules.elements()).registerAll(),
  
};

// catalogues, each one a promise
const data = {
  /*
  get filters  () { return modules.$load('filters');  },
  get patterns () { return modules.$load('patterns'); },
  get webfonts () { return modules.$load('webfonts'); },
  */
  
  get filters  () { return modules.filters ().then(module => module.data); },
  get icons    () { return modules.icons   ().then(module => module.default); },
  get patterns () { return modules.patterns().then(module => module.data); },
  get themes   () { return gestalt.themes(); },
  get webfonts () { return modules.webfonts().then(module => module.data); },
};

const dom = {
  adoptStylesheet : async (...args) => (await modules.domina('adoptStylesheet'))(...args),
  getStyleToken   : async (...args) => (await modules.domina('getStyleToken'))(...args),
  setStyleToken   : async (...args) => (await modules.domina('setStyleToken'))(...args),
};

// :::::: COMBINED ::::::::::::::::::::::::::::::::::::::::::::::

// the keys of aufbau.apply() and friends
const KINDS = { filter: filters, font: webfonts, pattern: patterns };

const kindOf = (key) => {
  if (!KINDS[key]) throw new Error(`[@aufbau/api] unknown kind "${key}", expected ${Object.keys(KINDS).join(', ')}`);
  return KINDS[key];
};

// 'dots' | { id: 'dots', ...options } | ['dots', options]
const entryOf = (value) =>
    typeof value === 'string' ? [value, {}]
  : Array.isArray(value)      ? [value[0], value[1] ?? {}]
  : (({ id, ...options }) => [id, options])(value);

/** applies several kinds at once, null removes one: { filter, font, pattern } */
const apply = (target, spec = {}) => Promise.all(Object.entries(spec).map(([key, value]) =>
  value == null ? kindOf(key).remove(target) : kindOf(key).apply(target, ...entryOf(value))
));

/** changes the options of what is already applied: { pattern: { fg: '#0f0' } } */
const update = (target, spec = {}) => Promise.all(Object.entries(spec).map(([key, options]) => kindOf(key).update(target, options)));

/** removes the given kinds, all of them by default */
const remove = (target, keys = Object.keys(KINDS)) => Promise.all(keys.map(key => kindOf(key).remove(target)));

// :::::: BOOT ::::::::::::::::::::::::::::::::::::::::::::::::::

const config = {
  // reset and themes are stylesheets that are either there or not, the rest goes
  // through gestalt. themes: false when the page links css/themes.css itself
  css : {
    layout : false,
    look   : 'flat',
    mode   : null,
    reset  : true,
    skin   : 'monochrome',
    theme  : 'zombie',
    themes : true,
  },

  // mode: 'auto' | 'all' | false. every other key is element config, e.g. { code: { theme: 'nord' } }
  elements : {
    mode : 'auto',
  },

  font : ['manrope'],
};

let booted = false;

const setConfig = (options = {}) => deepMerge(config, options);

async function boot (options = {}) {
  setConfig(options);
  if (booted || typeof window === 'undefined') return booted;
  booted = true;

  const { css: { layout, look, mode: themeMode, reset, skin, theme, themes }, elements: { mode, ...defaults }, font } = config;

  // the reset first, the themes next, the gestalt layers after them. a sheet is
  // appended once it is fetched, so each waits for the one before it: otherwise
  // the reset can land last and override body's colors
  if (reset)  await dom.adoptStylesheet(`${CSS_PATH}/aufbau.css`);
  if (themes) await dom.adoptStylesheet(`${CSS_PATH}/themes.css`);

  if (Object.keys(defaults).length) await elements.setConfig(defaults, { layer: 'defaults' });

  await Promise.all([
    gestalt.set({ layout, look, mode: themeMode, skin, theme }),
    mode === 'auto' && elements.enableAutoload(),
    mode === 'all'  && elements.registerAll(),
    font && webfonts.init(font),
  ]);

  return booted;
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

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

export { apply, boot, config, data, dom, elements, filters, gestalt, patterns, remove, setConfig, update, webfonts };
export default aufbau;
