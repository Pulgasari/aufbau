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

console.log('[@aufbau/runtime] config:', config);

// :::::: CONFIG

function setConfig (options = {}) {
  deepMerge(config, options);
  elements.setConfig(config.elements, { layer: 'defaults' });
  return config;
}

// :::::: INIT

const initWebfonts = (fontConfig) => {
  if (!fontConfig) return;
  
  const list = Array.isArray(fontConfig) ? fontConfig : [fontConfig];

  list.forEach(entry => {
    const isObj = isPlainObject(entry);
    const family      = isObj ? entry.family      : entry;
    const src         = isObj ? entry.src         : `${fontPath}/${family.toLowerCase()}.ttf`;
    const descriptors = isObj ? entry.descriptors : { display: 'swap' };

    // register font face and trigger dynamic load via @domina/core font sugar
    dom.font(family).add(src, descriptors).load();
  });

  // set primary font family as CSS variable on root
  const primaryFont = isPlainObject(list[0]) ? list[0].family : list[0];
  if (primaryFont && dom.root) dom.root.style.setProperty('--aufbau-font-family', `'${primaryFont}', sans-serif`);    
}

const initAppearance = () => {
  const { layout, look, reset, skin, theme } = config.css;

  // load + apply font-files
  initWebfonts(config.font);

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
    initAppearance ();
    initElements   (config.elements);
    initStylesheet (config.stylesheet);
    isBooted = true;
  }
  
  return isBooted;
}

// :::::: EXPORTS

const init = boot;

export { boot, init, setConfig };
