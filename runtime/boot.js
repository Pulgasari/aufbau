// init.js

import * as client   from './client.js';
import * as dom      from '@domina/core';
import * as elements from '@aufbau/elements';
import * as utils    from '@aufbau/js';
import config        from './config.js';

const { deepMerge, isPlainObject } = utils;
const cssPath = 'https://code.pulgasari.dev/aufbau/css';

let isBooted = false;

// :::::: DEBUG

console.log('[runtime] configs:', configs);

// :::::: CONFIG

function setConfig (options = {}) {
  deepMerge(config, options);
  elements.setConfig(config.elements, { layer: 'defaults' });
  return config;
}

// :::::: INIT

const initAppearance = () => {
  const { css, font } = config;
  const { layout, look, reset, skin, theme } = css;

  // load + apply font-files

  // load + apply css-files
  if (reset)  dom.adoptStylesheet(`${cssPath}/aufbau.css`); // needs to be improved   
  if (layout) dom.adoptStylesheet(`${cssPath}/layouts/${layout}.css`);
  if (look)   dom.adoptStylesheet(`${cssPath}/looks/${look}.css`);
  if (skin)   dom.adoptStylesheet(`${cssPath}/skins/${skin}.css`);
  if (theme)  dom.adoptStylesheet(`${cssPath}/themes/${theme}.css`);
}

const initElements = async ({ mode = 'auto' }) => {
       if (mode === 'auto')      elements.autoloader();
  else if (mode === 'all') await elements.registerAll();
}

const initStylesheet = (bool) => bool && client.observeStylesheets();

// boots the aufbau runtime in the browser
async function boot (options = {}) {
  setConfig(options);

  if (typeof window !== 'undefined' && !isBooted) {
    initElements   (config.elements);
    initStylesheet (config.stylesheet);
    isBooted = true;
  }
  
  return isBooted;
}

// :::::: EXPORTS

const init = boot;

export { boot, init, setConfig };
