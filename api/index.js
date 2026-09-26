// @aufbau/api
// one entry for the aufbau packages. nothing is imported up front, every
// namespace imports its package on the first call, so every method is async.
//
//   import aufbau from '@aufbau/api';
//
//   await aufbau.boot({ css: { theme: 'oled' }, font: ['manrope'] });
//
//   await aufbau.filters.apply('#logo', 'blur', { amount: 4 });
//   await aufbau.apply('#hero', { filter: 'grain', font: 'lexend', pattern: { id: 'dots', fg: '#f00' } });
//   await aufbau.update('#hero', { pattern: { fg: '#0f0' } });
//   await aufbau.remove('#hero', ['pattern']);
//
//   await aufbau.elements.enableAutoload();
//   await aufbau.data.filters;
//
// filters, patterns and webfonts share one contract:
//   apply(target, id, options)   update(target, options)   remove(target, options)
//   use(id, options) -> handle   load(id)                   list()   data

import { deepMerge } from '@pulgasari/obj';

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
};

// :::::: NAMESPACES ::::::::::::::::::::::::::::::::::::::::::::

const filters  = facade(modules.filters , [...CONTRACT, 'createPipeline', 'supports']);
const patterns = facade(modules.patterns, CONTRACT);
const webfonts = facade(modules.webfonts, [...CONTRACT, 'configure', 'init']);

const elements = {
  enableAutoload : async (options) => (await modules.elements()).autoloader(options),
  getConfig      : async (...args) => (await modules.config()).getConfig(...args),
  load           : async (tag)     => (await modules.elements()).load(tag),
  registerAll    : async ()        => (await modules.elements()).registerAll(),
  setConfig      : async (...args) => (await modules.config()).setConfig(...args),
};

// catalogues, each one a promise
const data = {
  get filters  () { return modules.filters ().then(module => module.data); },
  get icons    () { return modules.icons   ().then(module => module.default); },
  get patterns () { return modules.patterns().then(module => module.data); },
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

const CSS_PATH = 'https://code.pulgasari.dev/aufbau/css';

const config = {
  css : {
    layout : false,
    look   : 'flat',
    reset  : true,
    skin   : 'monochrome',
    theme  : 'zombie',
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

  const { css, elements: { mode, ...defaults }, font } = config;

  // the reset first, the layers after it in cascade order
  const sheets = [css.reset && 'aufbau', css.layout && `layouts/${css.layout}`, css.look && `looks/${css.look}`, css.skin && `skins/${css.skin}`, css.theme && `themes/${css.theme}`];
  for (const sheet of sheets.filter(Boolean)) dom.adoptStylesheet(`${CSS_PATH}/${sheet}.css`);

  if (Object.keys(defaults).length) await elements.setConfig(defaults, { layer: 'defaults' });

  await Promise.all([
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
  patterns,
  remove,
  setConfig,
  update,
  webfonts,
};

api.getTheme = ()   => dom.getStyleToken('theme'),
api.setTheme = (id) => dom.setStyleToken('theme', id),

api.getThemeMode = ()   => dom.getStyleToken('theme-mode'),
api.setThemeMode = (id) => dom.setStyleToken('theme-mode', id),

export { apply, boot, config, data, dom, elements, filters, patterns, remove, setConfig, update, webfonts };
export default aufbau;
