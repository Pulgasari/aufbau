// init.js

import * as client   from './client.js';
import * as elements from '@aufbau/elements';
import * as utils    from '@aufbau/js';

import configs from './configs.js';

const { deepMerge, isPlainObject } = aufbauUtils;
console.log('[runtime] configs:', configs);

const RESERVED_ELEMENT_KEYS = new Set(['mode']);
const normalizeElements = value => value ?? null;

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

// pushes element config into the AufbauConfigStore as the lowest layer
function syncElementConfig () {
  const entries = {};
  for (const [key, value] of Object.entries(configs.elements)) {
    if (!RESERVED_ELEMENT_KEYS.has(key)) entries[key] = value;
  }
  aufbauElements.setConfig(entries, { layer: 'defaults' });
}

function config (options = {}) {
  const { elements, splash, stylesheet, ...rest } = options;

  const normalized = normalizeElements(elements);
  if (normalized)               deepMerge(configs.elements, normalized);
  if (splash)                   deepMerge(configs.splash, splash);
  if (stylesheet !== undefined) configs.stylesheet = stylesheet;

  deepMerge(configs.elements, rest);

  syncElementConfig(); // also runs on calls after boot, so config() stays live
  return configs;
}

// :::::: RUNTIME ::::::::::::::::::::::::::::::::::::::::::::::::

let initialized = false;

async function initElements ({ mode = 'auto' }) {
       if (mode === 'auto')      elements.autoloader();
  else if (mode === 'all') await elements.registerAll();
}

// boots the aufbau runtime in the browser
async function init (options = {}) {
  config(options);

  if (typeof window === 'undefined' || initialized) return aufbau;
  initialized = true;
  
  if (configs.stylesheet) aufbauClient.observeStylesheets();

  initElements(configs.elements);
  
  return aufbau;
}

// :::::: EXPORTS

export { config, init };
