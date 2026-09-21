// @aufbau/api

// :::::: IMPORT

import elements      from '@aufbau/elements';
import webfonts      from '@aufbau/webfonts';
import { deepMerge } from '@pulgasari/obj';

import { setConfig as setElementsConfig } from '@aufbau/elements/core/AufbauConfig.js';

// :::::: CONFIG

const config = {

  // @aufbau/elements
  elements : { 
    mode: 'auto', // 'all' | 'auto' | false
  },
  
  /*
  // data
  data : {
    layouts : ['mobile'],
    looks   : ['flat', 'rounded'],
    skins   : ['monochrome'],
    themes  : ['classic', 'oled', 'rainbow', 'zombie'],
  },
  */

  // appearance
  font : ['Manrope'],
  css : {
    reset  : true,
    layout : false,
    look   : 'flat',
    skin   : 'monochrome',
    theme  : 'zombie',
  }
};

// :::::: 

const  cssPath = 'https://code.pulgasari.dev/aufbau/css';
const fontPath = 'https://code.pulgasari.dev/aufbau/webfonts/ttf';

// :::::: HELPERS

const lazy = (importFn) => {
  let cachedFn = null;
  return async (...args) => {
    if (!cachedFn) {
      const module = await importFn();
      cachedFn = module.default || module;
    }
    return cachedFn(...args);
  };
};

const lazyDomina = (method) => lazy(() => import(`@domina/methods/${method}.js`));      

// :::::: 

class AufbauAPI {
  config = config;
  #isBooted = false;
  
  set theme(value) {
    this.setTheme(value).catch(console.error);
  }

  getTheme = async ()   => this.dom.getStyleToken('theme');
  setTheme = async (id) => this.dom.setStyleToken('theme', id);

  initElements = async ({ mode = 'auto' }) => {
         if (mode === 'auto')      elements.autoloader();
    else if (mode === 'all') await elements.registerAll();
  };
  
  initStyleSheets = ({ layout, look, reset, skin, theme }) => {
    if (reset)  this.dom.adoptStylesheet(`${cssPath}/aufbau.css`); // needs to be improved   
    if (layout) this.dom.adoptStylesheet(`${cssPath}/layouts/${layout}.css`);
    if (look)   this.dom.adoptStylesheet(`${cssPath}/looks/${look}.css`);
    if (skin)   this.dom.adoptStylesheet(`${cssPath}/skins/${skin}.css`);
    if (theme)  this.dom.adoptStylesheet(`${cssPath}/themes/${theme}.css`);
  };

  boot = async (options = {}) => {
    this.setConfig(options);
  
    if (typeof window !== 'undefined' && !this.#isBooted) {
      webfonts.init(this.config.font); // load + apply font-files
      this.initStyleSheets(this.config.css);
      this.initElements   (this.config.elements);
      this.#isBooted = true;
    }
    
    return this.#isBooted;
  }

  setConfig = (options = {}) => {
    deepMerge(this.config, options);
    setElementsConfig(this.config.elements, { layer: 'defaults' });
    return this.config;
  }


  // static lazy bridge to @domina
  dom = {
    adoptStylesheet : lazyDomina('adoptStylesheet'),
    getStyleToken   : lazyDomina('getStyleToken'),
    setStyleToken   : lazyDomina('setStyleToken'),
  };
}

const api = new AufbauAPI;

export default api;

/* :::::: USAGE

import aufbau from '@aufbau/api';

aufbau.boot();

aufbau.setTheme('oled');

*/
