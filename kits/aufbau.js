/* @aufbau/kits/aufbau.js

framework-agnostic core-kit. 
bundles all aufbau-packages into one namespace.
every framework-kit builds on top of this file.

*/// ::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import      aufbauCache         from '@aufbau/cache';
import * as aufbauElements      from '@aufbau/elements';
import * as aufbauFilters       from '@aufbau/filters';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPluginsClient from '@aufbau/plugins/client';
import * as aufbauPluginsWorker from '@aufbau/plugins/worker';
import * as aufbauStore         from '@aufbau/store';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/js';

// ::: OTHERS
import * as bunker from '@bunker/kit';
import * as domina from '@domina/core';
//import      doc from '@domina/doc';


// ::: LOCAL
import { define, update, updateDataset, updateProperty } from './dom.js';
const { deepMerge, isPlainObject } = aufbauUtils;

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

const RESERVED_ELEMENT_KEYS = new Set(['mode']);

// keeps the old shorthand working: elements: 'auto' -> elements: { mode: 'auto' }
const normalizeElements = (value) =>
  value === undefined ? null : (isPlainObject(value) ? value : { mode: value });

/** pushes element config into the AufbauConfigStore as the lowest layer */
function syncElementConfig () {
  const entries = {};
  for (const [key, value] of Object.entries(configs.elements)) {
    if (!RESERVED_ELEMENT_KEYS.has(key)) entries[key] = value;
  }
  aufbauElements.setConfig(entries, { layer: 'defaults' });
}



const configs = {
  // 'auto'  : lazy autoloader, elements are fetched when they appear in the dom
  // 'all'   : eagerly register every element up front
  // false   : do not touch @aufbau/elements at all
  elements   : { mode: 'auto' },
  // the initial loading screen, see <aufbau-splash>. fonts is off because
  // document.fonts.ready can stall on a slow webfont host, and that is the last
  // thing worth holding the whole app behind
  splash     : { fonts: false },
  // observe <link>/<style> and transform aufbau stylesheets client-side
  stylesheet : true,
};

export function config (options = {}) {
  const { elements, splash, stylesheet, ...rest } = options;

  const normalized = normalizeElements(elements);
  if (normalized)               deepMerge(configs.elements, normalized);
  if (splash)                   deepMerge(configs.splash, splash);
  if (stylesheet !== undefined) configs.stylesheet = stylesheet;

  // bare keys keep going to the element config, which is how this has always
  // been called: config({ mode: 'all' }), config({ 'toast-duration': 2000 })
  deepMerge(configs.elements, rest);

  syncElementConfig(); // also runs on calls after boot, so config() stays live
  return configs;
}

// :::::: RUNTIME :::::::::::::::::::::::::::::::::::::::::::::::

let initialized = false;

/**
 * boots the aufbau runtime in the browser. idempotent, no-op outside the browser.
 * @param {Partial<typeof defaults>} [options]
 */
export async function init (options = {}) {
  config(options);

  if (typeof window === 'undefined' || initialized) return aufbau;
  initialized = true;

  // both of these register their own ready() gate, and both do their first pass
  // synchronously — so the gates are populated before <aufbau-splash> can await
  if (configs.stylesheet) aufbauPluginsClient.observeStylesheets();

       if (configs.elements.mode === 'auto')      aufbauElements.autoloader();
  else if (configs.elements.mode === 'all') await aufbauElements.registerAll();

  if (configs.splash.fonts) aufbauUtils.gate('fonts', domina.fontsReady);

  return aufbau;
}

/**
 * combined master fetch handler for service workers.
 * checks all registered aufbau plugins in sequence.
 * @param {FetchEvent} event
 * @returns {Promise<Response|null>}
 */
export async function interceptFetch (event) {
  // 1. stylesheet plugin
  const stylesheetResponse = await aufbauPluginsWorker.interceptFetchStylesheet(event);
  if (stylesheetResponse) return stylesheetResponse;

  // 2. fonts. cached as responses, so the browser's font pipeline is untouched
  //    and font-display / unicode-range keep working
  const fontResponse = await aufbauPluginsWorker.interceptFetchFont(event);
  if (fontResponse) return fontResponse;

  return null;
}

// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  // config + runtime
  config, configs,
  init, interceptFetch,

  // the boot barrier <aufbau-splash> waits on. also useful on its own: gate() any
  // promise the app must not be declared ready without
  gate  : aufbauUtils.gate,
  ready : aufbauUtils.ready,

  // dom bridge (see ./dom.js, candidate for @aufbau/utils)
  dom: domina,
  define, update, updateDataset, updateProperty,

  // packages
  cache      : aufbauCache,
  elements   : aufbauElements,
  filters    : aufbauFilters,
  import     : aufbauImport,
  store      : aufbauStore,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // storage engine. the aufbau presets above sit on this, but it is exposed raw
  // too, so an app can open its own database or cache without a second dependency.
  bunker,

  // adapters
  plugins : {
    client : aufbauPluginsClient,
    worker : aufbauPluginsWorker
  },
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export { aufbau };
export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// no framework, elements only
import aufbau from '@aufbau/kits/aufbau';
await aufbau.init();

// with a framework
import aufbau, { html } from '@aufbau/kits/preact-htm';

*/
