/* @aufbau/elements

entry point. intentionally side-effect free and lightweight:
importing this file does NOT pull in every element.
use autoloader() for lazy loading 
or registerAll() to get everything at once.

*/// :::: IMPORTS :::::::::::::::::::::::::::::::::::::::::::::::

// only toPascalCase is needed here. import the leaf directly instead of the
// @aufbau/js barrel: that barrel export-*'s @domina/core, @bunker/utils and the
// pulgasari utils, so pulling it just to resolve one string helper would drag
// the whole vendor graph onto the loader's critical path. keeps the entry lean.
import { toPascalCase } from '@pulgasari/str';

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

let   baseURL   = import.meta.url;
let   manifest  = null;
const PREFIX    = 'aufbau-';

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
    .filter (([key])    => key.startsWith('./Aufbau'))
    .map    (([, path]) => path);

  const all = Promise.all(paths.map(path => import(new URL(path, baseURL).href)));
  
  return all;
}

// :::::: AUTOLOADER ::::::::::::::::::::::::::::::::::::::::::::

function request (tag) {
  if (!tag || customElements.get(tag)) return;
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

// the entry stays a lean, lazy loader and does NOT re-export the core
// foundation. re-exporting it (export * from './core/index.js') made a bare
// `import { autoloader }` eagerly fetch and evaluate AufbauCore/Control/skin/
// styles/persist, and through them @domina/core and @bunker/storage, before
// autoloader() could even run its dom scan. consumers that need the base
// classes or the config api import them from the subpath directly:
//   import { AufbauElement }        from '@aufbau/elements/core/index.js';
//   import { setConfig, getConfig } from '@aufbau/elements/core/AufbauConfig.js';

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
