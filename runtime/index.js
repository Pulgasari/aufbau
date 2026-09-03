// @aufbau/runtime

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU

import * as elementsLoader from '@aufbau/elements';
import * as elementsCore    from '@aufbau/elements/core/index.js';
import * as elementsConfig  from '@aufbau/elements/core/AufbauConfig.js';
import * as filters    from '@aufbau/filters';
import * as gestures   from '@aufbau/gestures';
import      importFile from '@aufbau/import';
import * as patterns   from '@aufbau/patterns';
import * as stylesheet from '@aufbau/stylesheet';
import * as utils      from '@aufbau/js';
import * as webfonts   from '@aufbau/webfonts';

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

// the @aufbau/elements entry is now a lean lazy loader and no longer re-exports
// the core foundation. this bundle is the heavy "everything" entry, so it
// reconstructs the historical elements surface (loader api + core classes +
// config) from the subpaths. `export *` never forwards a default, so the config
// default (the AufbauConfig class, already present as a named export) is
// stripped to reproduce the old namespace shape exactly.
const { default: _aufbauConfigDefault, ...elementsConfigExports } = elementsConfig;
const elements = { ...elementsCore, ...elementsConfigExports, ...elementsLoader };

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
  gestures,
  import: importFile,
  patterns,
  stylesheet,
  utils,
  webfonts,

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
import aufbau from '@aufbau/runtime';
await aufbau.init();

// with a framework
import aufbau, { html } from '@aufbau/kits/preact-htm';

*/
