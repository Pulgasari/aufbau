/* @aufbau/elements

entry point. intentionally side-effect free and lightweight:
importing this file does NOT pull in every element.
use autoloader() for lazy loading 
or registerAll() to get everything at once.

*/// :::: IMPORTS :::::::::::::::::::::::::::::::::::::::::::::::

import AufbauConfig  from './core/AufbauConfig.js';
import AufbauCore    from './core/AufbauCore.js';
import AufbauElement from './core/AufbauElement.js';

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

const PREFIX = 'aufbau-';

// 'aufbau-tree-item' -> 'AufbauTreeItem'
const toPascalCase = (str) => str.split(/[-_\s]+/).filter(Boolean)
  .map(word => word[0].toUpperCase() + word.slice(1)).join('');

// resolve module urls relative to this file unless a base is configured
let baseURL = import.meta.url;

// tags already requested, prevents duplicate network calls
const requested = new Set();

/**
 * reads the aufbau tag of an element, including customized built-ins.
 * <aufbau-flag>            -> 'aufbau-flag'
 * <datalist is="aufbau-x"> -> 'aufbau-x'
 * @param {Element} el
 * @returns {string|null}
 */
function tagOf (element) {
  const is = element.getAttribute?.('is');
  if (is?.startsWith(PREFIX)) return is;
  return element.localName?.startsWith(PREFIX) ? element.localName : null;
}

// :::::: LOADING :::::::::::::::::::::::::::::::::::::::::::::::

/**
 * dynamically imports and thereby registers a single element by tag name.
 * element modules register themselves via their trailing X.init() call.
 * @param {string} tag - e.g. 'aufbau-slider'
 * @returns {Promise<any>}
 */
export function load (tag) {
  const url = new URL(`./${toPascalCase(tag)}.js`, baseURL).href;
  return import(url).catch(err => {
    console.warn(`[@aufbau/elements] could not load <${tag}> from "${url}":`, err);
    return null;
  });
}

/**
 * imports every element at once. good for prototyping and ssr-less bundles.
 * @returns {Promise<any>}
 */
export function registerAll () {
  return import (new URL('./all.js', baseURL).href);
}

// :::::: AUTOLOADER ::::::::::::::::::::::::::::::::::::::::::::

function request (tag) {
  if (!tag || requested.has(tag) || customElements.get(tag)) return;
  requested.add(tag);
  load(tag);
}

function scan (node) {
  if (node?.nodeType !== Node.ELEMENT_NODE) return;
  request(tagOf(node));
  node.querySelectorAll('*').forEach(el => request(tagOf(el)));
}

/**
 * watches the dom and loads elements on demand as soon as they appear.
 * covers markup injected later, e.g. html rendered through @aufbau/import.
 * @param {Object} [options]
 * @param {string} [options.base] - override the module base url
 * @param {Element|Document} [options.root=document]
 * @returns {() => void} stop function, disconnects the observer
 */
export function autoloader ({ base, root = document } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (base) baseURL = base;

  // 1. initial pass over what is already there
  scan(root.documentElement ?? root);

  // 2. only walk what actually got added, no repeated full-document scans
  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(scan);
    }
  });

  observer.observe (
    root.body ?? root.documentElement ?? root, 
    { childList: true, subtree: true }
  );

  return () => observer.disconnect();
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export { AufbauElement };

export default { AufbauElement, autoloader, load, registerAll };

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// lazy, browser first
import { autoloader } from '@aufbau/elements';
const stop = autoloader();

// everything at once
import { registerAll } from '@aufbau/elements';
await registerAll();

// hand picked
import '@aufbau/elements/AufbauFlag.js';

*/
