/* @aufbau/elements

entry point. intentionally side-effect free and lightweight:
importing this file does NOT pull in every element.
use autoloader() for lazy loading 
or registerAll() to get everything at once.

*/// :::: IMPORTS :::::::::::::::::::::::::::::::::::::::::::::::

import { dom, toPascalCase } from '@aufbau/js';

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

const EXCLUDED = new Set([
  './core/AufbauConfig.js',
  './core/AufbauCore.js',
]);

let   baseURL   = import.meta.url;
let   manifest  = null; 
const PREFIX    = 'aufbau-';
const requested = new Set;

function tagOf (element) {
  return element.localName?.startsWith(PREFIX) ? element.localName : null;
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

export * from './core/AufbauConfig.js';
export * from './core/AufbauCore.js';

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
