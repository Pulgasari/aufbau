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

function config (options = {}) {
  const { elements, stylesheet, ...rest } = options;

  elements ??= null;
  if (elements)   deepMerge(configs.elements, elements);
  if (stylesheet) configs.stylesheet = stylesheet;
  
  elements.setConfig(configs.elements, { layer: 'defaults' });
  return configs;
}

// :::::: INIT

async function initElements ({ mode = 'auto' }) {
       if (mode === 'auto')      elements.autoloader();
  else if (mode === 'all') await elements.registerAll();
}

const initStylesheet = (bool) => bool && client.observeStylesheets();

// boots the aufbau runtime in the browser
async function init (options = {}) {
  config(options);

  if (typeof window !== 'undefined' && !isBooted) {
    initElements   (configs.elements);
    initStylesheet (configs.stylesheet);
    isBooted = true;
  }
  
  return aufbau;
}

// :::::: EXPORTS

export { config, init };
