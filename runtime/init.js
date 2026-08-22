// init.js

import * as client   from './client.js';
import * as elements from '@aufbau/elements';
import * as utils    from '@aufbau/js';
import configs       from './configs.js';

const { deepMerge, isPlainObject } = utils;

let isBooted = false;

// :::::: DEBUG

console.log('[runtime] configs:', configs);

// :::::: CONFIG

function setConfig (options = {}) {
  deepMerge(configs, options);
  elements.setConfig(configs.elements, { layer: 'defaults' });
  return configs;
}

// :::::: INIT

const initElements = async ({ mode = 'auto' }) => {
       if (mode === 'auto')      elements.autoloader();
  else if (mode === 'all') await elements.registerAll();
}

const initStylesheet = (bool) => bool && client.observeStylesheets();

// boots the aufbau runtime in the browser
async function init (options = {}) {
  setConfig(options);

  if (typeof window !== 'undefined' && !isBooted) {
    initElements   (configs.elements);
    initStylesheet (configs.stylesheet);
    isBooted = true;
  }
  
  return aufbau;
}

// :::::: EXPORTS

export { init, setConfig };
