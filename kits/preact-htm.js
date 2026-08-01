// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import      aufbauCache         from '@aufbau/cache';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPluginsClient from '@aufbau/plugins/client';
import * as aufbauPluginsWorker from '@aufbau/plugins/worker';
import * as aufbauShaders       from '@aufbau/shaders';
import * as aufbauStylesheet    from '@aufbau/stylesheet';

// ::: HTM
import htm from 'htm'; 

// ::: PREACT
import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';

// :::::: BUILD :::::::::::::::::::::::::::::::::::::::::::::::::

const html = htm.bind(h);

const preact = { 
  ...preactCore,
  ...preactHooks,
  ...preactSignals,
};

const aufbau = {
  // AUFBAU
  config, configs, 
  init, interceptFetch,

  // aufbau-dirty (needs to be moved)
  define, update, updateDataset, updateProperty,

  // aufbau-packages
  cache      : aufbauCache,
  import     : aufbauImport,
  shaders    : aufbauShaders,
  stylesheet : aufbauStylesheet,

  // aufbau adapters
  plugins = {
    client : aufbauPluginsClient,
    worker : aufbauPluginsWorker
  },

  // Preact + HTM
  html, preact,
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

export aufbau;
export html;
export preact;

export default aufbau;

/* :::::: USAGE ::::::::::::::::::::::::::::::::::::::::::::::::: 

import aufbau, { html, preact } from '@aufbau/kits/preact-htm';

*/
