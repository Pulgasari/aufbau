// @aufbau/runtime/client.js

import createCache   from './cache.js';
//import { hashKey }   from '@aufbau/js';
import transformACSS from './../stylesheet/index.js'; //from '@aufbau/stylesheet';
//import * as dom    from '@domina/core';

const hashKey = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

// :::::: DATA

const cssCache   = createCache ({ name: 'css' }); //aufbau.cache.css.hashKey = fileContent;
const EXTENSIONS = ['.aufbau.css', '.ass'];
let   observer   = null;

// :::::: HELPERS

const isClient     = ()   => typeof window !== 'undefined' && window.document;
const isStylesheet = href => Boolean(href) && EXTENSIONS.some(extension => href.endsWith(extension));    

// :::::: METHODS

export async function compileStylesheet (input, compile) {
  const key    = hashKey(input);
  let   output = await cssCache.get(key);

  if (!output) {
    output = await compile(input);
    await cssCache.set(key, output);
  }
  
  return output;
}

// <link href='... .aufbau.css' />
export async function processStylesheetLink (node) {
  const href = node.getAttribute('href'); if (!isStylesheet(href)) return;
  console.log('aufbau-stylesheet detected:', href);
  
  try {
    const response = await fetch(href); if (!response.ok) return;
    const source   = await response.text();
    const css      = await compileStylesheet(source, transformACSS);

    const element = document.createElement('style');
    element.textContent = css;
    element.setAttribute('data-aufbau-src', href);
    node.replaceWith(element);

    cssCache.set(href, css);
    console.log('aufbau-stylesheet transformed and cached:', href);
  }
  catch (e) { console.error(`failed to process link stylesheet: ${href}`, e); }
}

// <style type='text/aufbau'>
export function processStyleElement (node) {
  if (node.type !== 'text/aufbau' || node.hasAttribute('data-aufbau-processed')) return;

  node.textContent = transformACSS(node.textContent);
  node.type = 'text/css';
  node.setAttribute('data-aufbau-processed', 'true');
}

// scans and transforms all existing stylesheets and inline styles in the DOM.
export function processStylesheets (ctx = document) {
  ctx.querySelectorAll   ('link[rel="stylesheet"]').forEach(processStylesheetLink);
  ctx.querySelectorAll('style[type="text/aufbau"]').forEach(processStyleElement);
}

// observes DOM for Aufbau stylesheets
export function observeStylesheets (ctx = document.head) {
  if (!isClient() || observer) return;
  processStylesheets(); // synchronous, so `inflight` is populated before anyone can reach ready()

  observer = new MutationObserver (mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
             if (node.tagName === 'LINK')  processStylesheetLink (node);
        else if (node.tagName === 'STYLE') processStyleElement   (node);
        else if (node.querySelectorAll)    processStylesheets    (node);
        }
      }
    }
  });

  observer.observe (ctx, { childList: true, subtree: true });
}
