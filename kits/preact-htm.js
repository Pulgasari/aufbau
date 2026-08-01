// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import aufbauCache                  from '@aufbau/cache';
import aufbauImport                 from '@aufbau/import';
import * as aufbauShaders           from '@aufbau/shaders';
import * as aufbauStylesheet        from '@aufbau/stylesheet';
import { observeStylesheets }       from '@aufbau/plugins/client';
import { interceptFetchStylesheet } from '@aufbau/plugins/worker';

// ::: PREACT
import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';

// ::: HTM
import htm from 'htm'; 
export const html = htm.bind(h);

const preact = { 
  ...preactCore,
  ...preactHooks,
  ...preactSignals,
};

export {
  preact,
}

export function init () {
  if (typeof window !== 'undefined') {
    observeStylesheets();
  }
}

// ::: AUFBAU





export * from '@aufbau/plugins/worker';

/**
 * Combined master fetch handler for Service Workers.
 * Checks all registered Aufbau plugins in sequence.
 * 
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function interceptFetch (event) {
  // 1. Check stylesheet plugin
  const stylesheetResponse = await interceptFetchStylesheet(event);
  if (stylesheetResponse) return stylesheetResponse;
  return null;
}

/**
 * Central Aufbau Singleton Instance
 */
export const aufbau = {
  // AUFBAU
  config, configs, 
  init, interceptFetch, interceptFetchStylesheet,
  cache, import: importFile,
  createApp, injectImportMap,
  shaders, stylesheet,
  define, update, updateDataset, updateProperty,

  // Preact + HTM
  preact,
};

export default aufbau;


