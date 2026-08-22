// @aufbau/runtime

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU

import * as aufbauElements      from '@aufbau/elements';
import * as aufbauFilters       from '@aufbau/filters';
import      aufbauImport        from '@aufbau/import';
import * as aufbauPatterns      from '@aufbau/patterns';
import * as aufbauStore         from './store.js';
import * as aufbauStylesheet    from '@aufbau/stylesheet';
import * as aufbauUtils         from '@aufbau/js';

import * as aufbauClient from './client.js';
import * as aufbauGui    from './gui.js';
import * as aufbauWorker from './worker.js';

import { setConfig, init } from './init.js';

//const fileURL = new URL("./configs.json5", import.meta.url);
//const configs = await aufbauImport(fileURL);
import configs from './configs.js';

//const { deepMerge, isPlainObject } = aufbauUtils;
//console.log('[runtime] configs:', configs);

// ::: VENDORS

import * as bunker from '@bunker/kit';
import * as domina from '@domina/core';
import      str    from '@pulgasari/str';

// :::::: MISC ::::::::::::::::::::::::::::::::::::::::::::::::

//const RESERVED_ELEMENT_KEYS = new Set(['mode']);
//const normalizeElements = value => value ?? null;

// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const dom = domina;

const aufbau = {
  // config + runtime
  setConfig, configs,
  init, //interceptFetch,
  
  //
  dom, domina, str,

  // gui: builds aufbau form controls from a spec object (see gui.js)
  gui : aufbauGui,

  // packages
  elements   : aufbauElements,
  filters    : aufbauFilters,
  import     : aufbauImport,
  patterns   : aufbauPatterns,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // storage engine. the aufbau presets above sit on this, but it is exposed raw
  // too, so an app can open its own database or cache without a second dependency.
  // aufbau.cache used to be a second cache layer of its own; it is bunker.cache now.
  bunker,

  // adapters
  plugins : {
    client : aufbauClient,
    worker : aufbauWorker
  },
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export { aufbau, dom, domina, str };
export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// no framework, elements only
import aufbau from '@aufbau/kits/aufbau';
await aufbau.init();

// with a framework
import aufbau, { html } from '@aufbau/kits/preact-htm';

*/
