// @aufbau/webfonts/index.js

import data     from './data.js';
import * as js  from '@aufbau/js';
import * as dom from '@domina/core';

const { deepMerge, isPlainObject } = js;
const arrayfied = v => Array.isArray(v) ? v : [v];
const fontPath  = 'https://code.pulgasari.dev/aufbau/webfonts/ttf';

// :::::: DEBUG

console.log('[@aufbau/webfonts] data:', data);
console.log('[@aufbau/webfonts] fontPath:', fontPath);

// :::::: INIT

function normalizeFont (entry) {
  const isObj = isPlainObject(entry);
  const family      = isObj ? entry.family      : entry;
  const src         = isObj ? entry.src         : `${fontPath}/${family.toLowerCase()}.ttf`;
  const descriptors = isObj ? entry.descriptors : { display: 'swap' };

  return {
    descriptors,
    family,
    src,
  }
}

function loadFont (entry) {
  const { descriptors, family, src } = normalizeFont(entry);

  // register font face and trigger dynamic load via @domina/core font sugar
  dom.font(family).add(src, descriptors).load();
}

function applyFont (font, scope) {
  scope ??= dom.root;
  
  const name = isPlainObject(font) ? font.family : font;
  if (name) scope?.style.setProperty('--aufbau-font', `'${name}', sans-serif`);    
}

const initWebfonts = (fontConfig) => {
  if (!fontConfig) return;

  const list = arrayfied(fontConfig);

  list.forEach(loadFont);

  // set primary font family as CSS variable on root
  // todo: this sucks lol
  applyFont (list[0]);
}






// create a FontFace object in memory
const manrope = new FontFace(
  'Manrope', 
  'url(/webfonts/ttf/manrope.ttf)', 
  {
    weight: '100 900', // variable font weight range
    display: 'swap'
  }
);

// start fetching the font file programmatically
await manrope.load();

// register in the document context
document.fonts.add(manrope);
