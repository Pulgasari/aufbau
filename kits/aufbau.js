// @aufbau/kits/aufbau

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import      aufbauCache         from '@aufbau/cache';
import      aufbauElements      from '@aufbau/elements';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPluginsClient from '@aufbau/plugins/client';
import * as aufbauPluginsWorker from '@aufbau/plugins/worker';
import * as aufbauShaders       from '@aufbau/shaders';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/utils';

// :::::: BUILD :::::::::::::::::::::::::::::::::::::::::::::::::

const aufbau = {
  // aufbau: config
  config, configs, 
  init, interceptFetch,

  // aufbau-dirty (needs to be moved)
  define, update, updateDataset, updateProperty,

  // aufbau-packages
  cache      : aufbauCache,
  elements   : aufbauElements,
  import     : aufbauImport,
  shaders    : aufbauShaders,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // aufbau adapters
  plugins = {
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

export aufbau;
export default aufbau;

/* :::::: USAGE ::::::::::::::::::::::::::::::::::::::::::::::::: 

@aufbau/kits/preact-htm
@aufbau/kits/preact-jsx
@aufbau/kits/react-jsx
@aufbau/kits/svelte

*/
