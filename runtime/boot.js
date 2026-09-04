// init.js

import * as client from './client.js';
import      config from './config.js';

import { autoloader, registerAll }        from '@aufbau/elements';
import { setConfig as setElementsConfig } from '@aufbau/elements/core/AufbauConfig.js';
import * as webfonts                      from '@aufbau/webfonts';

import { adoptStylesheet } from '@domina/methods';
import { deepMerge }       from '@pulgasari/obj';


const  cssPath = 'https://code.pulgasari.dev/aufbau/css';
const fontPath = 'https://code.pulgasari.dev/aufbau/webfonts/ttf';

let isBooted = false;

// :::::: DEBUG

console.log('[@aufbau/runtime] config:', config);

// :::::: CONFIG

function setConfig (options = {}) {
  deepMerge(config, options);
  setElementsConfig(config.elements, { layer: 'defaults' });
  return config;
}

// :::::: INIT

const initAppearance = () => {
  const { layout, look, reset, skin, theme } = config.css;

  // load + apply font-files
  webfonts.init(config.font)

  // load + apply css-files
  if (reset)  dom.adoptStylesheet(`${cssPath}/aufbau.css`); // needs to be improved   
  if (layout) dom.adoptStylesheet(`${cssPath}/layouts/${layout}.css`);
  if (look)   dom.adoptStylesheet(`${cssPath}/looks/${look}.css`);
  if (skin)   dom.adoptStylesheet(`${cssPath}/skins/${skin}.css`);
  if (theme)  dom.adoptStylesheet(`${cssPath}/themes/${theme}.css`);
}

const initElements = async ({ mode = 'auto' }) => {
       if (mode === 'auto')      autoloader();
  else if (mode === 'all') await registerAll();
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
