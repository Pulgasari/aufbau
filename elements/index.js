/* @aufbau/elements

entry point. intentionally side-effect free and lightweight:
importing this file does NOT pull in every element.
use autoloader() for lazy loading 
or registerAll() to get everything at once.

*/// :::: IMPORTS :::::::::::::::::::::::::::::::::::::::::::::::

import { dom, toPascalCase } from '@aufbau/js';

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

let   baseURL   = import.meta.url;
let   manifest  = null;
const PREFIX    = 'aufbau-';
const requested = new Set;

// covers both autonomous elements (<aufbau-flag>) and customized built-ins
// (<datalist is="aufbau-datalist">), which carry the name on `is` instead
function tagOf (element) {
  if (element.localName?.startsWith(PREFIX)) return element.localName;

  const is = element.getAttribute?.('is');
  return is?.startsWith(PREFIX) ? is : null;
}

// :::::: LOADING :::::::::::::::::::::::::::::::::::::::::::::::

function load (tag) {
  const url = new URL(`./${toPascalCase(tag)}.js`, baseURL).href;
  return import(url).catch(err => {
    console.warn(`[@aufbau/elements] could not load <${tag}> from "${url}":`, err);
    return null;
  });
}

async function registerAll () {
  manifest ??= (await import(new URL('./jsr.json', baseURL).href, { with: { type: 'json' } })).default;    

  const paths = Object.entries(manifest.exports ?? {})
    .filter(([key]) => key.startsWith('./Aufbau'))
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

function autoloader ({ base, root = document } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (base) baseURL = base;
  console.log('[@aufbau/elements] autoloader initialized.');

  // 1. initial pass over what is already there
  scan(root.documentElement ?? root);

  // 2. only walk what actually got added, no repeated full-document scans
  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
  });

  observer.observe (
    root.body ?? root.documentElement ?? root, 
    { childList: true, subtree: true }
  );

  return () => observer.disconnect();
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export * from './core/index.js';
export * from './core/AufbauConfig.js';

export {
  autoloader, 
  load, 
  registerAll
};

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
