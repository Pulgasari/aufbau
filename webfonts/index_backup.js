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

// :::::: API

const createFontFace (family, url, descriptor) {
  const ff = new FontFace (family, `url(${url})`, descriptor);
  return ff;
}

// ::: aufbau fonts

const apply = (name, obj, target) => {

};

const load = (name) => {
  const font = findByAnyCriteria(data.fonts, { name, id: name });

  for (const ff of font.faces){
    const { src, ...descriptor } = ff;
    const fontFace = createFontFace(family, src, descriptor);
    await fontFace.load(); // load
    document.fonts.add(fontFace); // register
  }
};

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


/*
display : ['swap', 'optional', 'block']; // Rendering-Verhalten beim Laden (FOUT vs. FOIT)        
stretch : ['normal', 'condensed', '75% 125%'];
style   : ['normal', 'italic', 'oblique'];
weight  : ['400', '100 900'];
*/

/*
https://developer.mozilla.org/de/docs/Web/API/CSS_Font_Loading_API
https://developer.mozilla.org/de/docs/Web/API/FontFace
https://developer.mozilla.org/de/docs/Web/API/FontFaceSet
*/

/*
FontFaceSet.ready
FontFaceSet.size
FontFaceSet.status

FontFaceSet.add()
FontFaceSet.check()
FontFaceSet.clear()
FontFaceSet.delete()
FontFaceSet.entries()
FontFaceSet.forEach()
FontFaceSet.has()
FontFaceSet.keys()
FontFaceSet.load()
FontFaceSet.values()

loading
loadingdone
loadingerror
*/



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







 

// interface: google fonts




const   findByCriteria = (array, criteria) => array.find   (item => item && Object.entries(criteria).every(([key, value]) => item[key] === value));        
const filterByCriteria = (array, criteria) => array.filter (item => item && Object.entries(criteria).every(([key, value]) => item[key] === value));

const   findByAnyCriteria = (array, criteria) => array.find   (item => item && Object.entries(criteria).some(([key, value]) => item[key] === value));
const filterByAnyCriteria = (array, criteria) => array.filter (item => item && Object.entries(criteria).some(([key, value]) => item[key] === value));


