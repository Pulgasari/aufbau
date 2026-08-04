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

// list to exclude that already-imported stuff at registerAll-method
const EXCLUDED = new Set([
  './core/AufbauConfig.js',
  './core/AufbauCore.js',
  './core/AufbauElement.js',
]);

let   baseURL   = import.meta.url; // resolve module urls relative to this file unless a base is configured
let   manifest  = null; // module-level cache, the manifest is fetched at most once
const PREFIX    = 'aufbau-';
const requested = new Set(); // tags already requested, prevents duplicate network calls

// 'aufbau-tree-item' -> 'AufbauTreeItem'
const toPascalCase = (str) => str.split(/[-_\s]+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join('');    

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



// not an element, just the base class

/**
 * imports every element at once. good for prototyping.
 * the element list is read from jsr.json, which is the single source of truth.
 * @returns {Promise<any[]>}
 */
export async function registerAll () {
  manifest ??= (await import(new URL('./jsr.json', baseURL).href, { with: { type: 'json' } })).default;    

  const paths = Object.entries(manifest.exports ?? {})
    .filter(([key, path]) => key.startsWith('./Aufbau') && !EXCLUDED.has(path))
    .map(([, path]) => path);

  return Promise.all(paths.map(path => import(new URL(path, baseURL).href)));
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
