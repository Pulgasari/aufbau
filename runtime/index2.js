import mod from '@aufbau/modflow';

mod.define({
  // aufbau runtime modules
  client     : { url: './client.js' , flow: 'lazy'  },
  config     : { url: './config.js' , flow: 'eager', what: 'default' },
  data       : { url: './data.js'   , flow: 'eager', what: 'default' },
  gui        : { url: './gui.js'    , flow: 'lazy'  },
  store      : { url: './store.js'  , flow: 'lazy'  },
  worker     : { url: './worker.js' , flow: 'lazy'  },

  // aufbau packages
  elements   : { url: '@aufbau/elements'   , flow: 'eager' },
  filters    : { url: '@aufbau/filters'    , flow: 'lazy'  },
  gestures   : { url: '@aufbau/gestures'   , flow: 'lazy'  },
  import     : { url: '@aufbau/import'     , flow: 'lazy', what: 'default' },
  patterns   : { url: '@aufbau/patterns'   , flow: 'idle'  },
  stylesheet : { url: '@aufbau/stylesheet' , flow: 'idle'  },
  utils      : { url: '@aufbau/js'         , flow: 'eager' },
  webfonts   : { url: '@aufbau/webfonts'   , flow: 'idle'  },

  // vendors
  bunker   : { url: '@bunker/core'   , flow: 'lazy'  },
  domina   : { url: '@domina/core'   , flow: 'lazy'  },
  str      : { url: '@pulgasari/str' , flow: 'lazy'  },
});

const aufbau = {

  mod,

  //
  client : mod.client,
  config : mod.config,
  data   : mod.data,
  gui    : mod.gui,
  store  : mod.store,
  worker : mod.worker,

  //
  elements   : mod.elements,
  filters    : mod.filters,
  gestures   : mod.gestures,
  import     : mod.import,
  patterns   : mod.patterns,
  stylesheet : mod.stylesheet,
  utils      : mod.utils,
  webfonts   : mod.webfonts,
};

const bunker = mod.bunker;
const dom    = mod.domina;
const str    = mod.str;

export {
  aufbau,
  bunker,
  dom,
  str,
};

export default aufbau;
