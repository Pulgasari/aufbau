// @aufbau/runtime

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU

import * as elements   from '@aufbau/elements';
import * as filters    from '@aufbau/filters';
import      importFile from '@aufbau/import';
import * as patterns   from '@aufbau/patterns';
import * as stylesheet from '@aufbau/stylesheet';
import * as utils      from '@aufbau/js';

import { boot, setConfig } from './boot.js';
import * as client from './client.js';
import      config from './config.js';
import      data   from './data.js';
import * as gui    from './gui.js';
import * as store  from './store.js';
import * as worker from './worker.js';

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
  data,
  gui,
  store,
  
  // packages
  elements,
  filters,
  import: importFile,
  patterns,
  stylesheet,
  utils,

  // adapters
  plugins : {
    client,
    worker,
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
