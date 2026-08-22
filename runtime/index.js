// @aufbau/runtime

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU

import * as aufbauElements   from '@aufbau/elements';
import * as aufbauFilters    from '@aufbau/filters';
import      aufbauImport     from '@aufbau/import';
import * as aufbauPatterns   from '@aufbau/patterns';
import * as aufbauStylesheet from '@aufbau/stylesheet';
import * as aufbauUtils      from '@aufbau/js';

import { boot, setConfig } from './boot.js';
import * as aufbauClient from './client.js';
import      config       from './config.js';
import * as aufbauGui    from './gui.js';
import * as aufbauStore  from './store.js';
import * as aufbauWorker from './worker.js';

// ::: VENDORS

import * as bunker from '@bunker/kit';
import * as domina from '@domina/core';
import      str    from '@pulgasari/str';

// :::::: BUNDLE :::::::::::::::::::::::::::::::::::::::::::::::::

const dom = domina;

const aufbau = {
  // deprecated
  configs: config,
  init: boot,
  
  // runtime
  boot, //interceptFetch,
  config, setConfig,
  gui : aufbauGui,
  
  // packages
  elements   : aufbauElements,
  filters    : aufbauFilters,
  import     : aufbauImport,
  patterns   : aufbauPatterns,
  store      : aufbauStore,
  stylesheet : aufbauStylesheet,
  utils      : aufbauUtils,

  // adapters
  plugins : {
    client : aufbauClient,
    worker : aufbauWorker
  },

  // vendors
  bunker, dom, domina, str,
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export { aufbau, bunker, dom, domina, str };
export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// no framework, elements only
import aufbau from '@aufbau/kits/aufbau';
await aufbau.init();

// with a framework
import aufbau, { html } from '@aufbau/kits/preact-htm';

*/
