/* @aufbau/kits/aufbau.js

framework-agnostic core-kit. 
bundles all aufbau-packages into one namespace.
every framework-kit builds on top of this file.

*/// ::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import      aufbauCache         from '@aufbau/cache';
import      aufbauElements      from '@aufbau/elements';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPluginsClient from '@aufbau/plugins/client';
import * as aufbauPluginsWorker from '@aufbau/plugins/worker';
import * as aufbauShaders       from '@aufbau/shaders';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/utils';

// ::: LOCAL
import { define, update, updateDataset, updateProperty } from './dom.js';

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

const configs = {
  // 'auto'  : lazy autoloader, elements are fetched when they appear in the dom
  // 'all'   : eagerly register every element up front
  // false   : do not touch @aufbau/elements at all
  elements   : 'auto',
  // observe <link>/<style> and transform aufbau stylesheets client-side
  stylesheet : true,
};

/**
 * merges options into the runtime config. returns the current config.
 * @param {Partial<typeof defaults>} [options]
 */
export function config (options = {}) {
  Object.assign(configs, options);
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

  if (configs.stylesheet) aufbauPluginsClient.observeStylesheets();

  if (configs.elements === 'auto')     aufbauElements.autoloader();
  else if (configs.elements === 'all') await aufbauElements.registerAll();

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
  return null;
}

// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  // config + runtime
  config, configs,
  init, interceptFetch,

  // dom bridge (see ./dom.js, candidate for @aufbau/utils)
  define, update, updateDataset, updateProperty,

  // packages
  cache      : aufbauCache,
  elements   : aufbauElements,
  import     : aufbauImport,
  shaders    : aufbauShaders,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // adapters
  plugins : {
    client : aufbauPluginsClient,
    worker : aufbauPluginsWorker
  },
};

export function init () {
  if (typeof window !== 'undefined') {
    aufbauPluginsClient.observeStylesheets();
  }
}


// Combined master fetch handler for Service Workers.
// Checks all registered Aufbau plugins in sequence.
export async function interceptFetch (event) {
  // 1. Check stylesheet plugin
  const stylesheetResponse = await aufbauPluginsWorker.interceptFetchStylesheet(event);
  if (stylesheetResponse) return stylesheetResponse;
  return null;
}

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
