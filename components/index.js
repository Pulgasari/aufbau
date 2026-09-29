/* @aufbau/components

ready to use components, composed of @aufbau/elements. like the elements entry
this file is side effect free: nothing is defined until it is used.

  autoloader()    defines each component the first time its tag shows up. starts
                  the autoloader of the elements too (elements: false leaves it
                  out), so the page needs nothing else
  load(name)      one component by its canonical name, e.g. 'pick-icon'
  registerAll()   every component at once
  configure()     a prefix or a map of new tags, before the first one loads

*/// :::: IMPORTS :::::::::::::::::::::::::::::::::::::::::::::::

import { COMPONENTS, configure, nameOf, pathOf, tagOf } from './core/names.js';

// :::::: LOADING :::::::::::::::::::::::::::::::::::::::::::::::

const loading = new Map;

function load (name) {
  if (!loading.has(name)) {
    const url = new URL(pathOf(name), import.meta.url).href;
    loading.set(name, import(url).catch(error => {
      console.warn(`[@aufbau/components] could not load <${tagOf(name)}> from "${url}":`, error);
      loading.delete(name);
      return null;
    }));
  }
  return loading.get(name);
}

const registerAll = () => Promise.all(COMPONENTS.map(load));

// :::::: AUTOLOADER ::::::::::::::::::::::::::::::::::::::::::::

function request (tag) {
  const name = tag && nameOf(tag);
  if (name && !customElements.get(tag)) load(name);
}

function scan (node) {
  if (node?.nodeType !== Node.ELEMENT_NODE) return;
  request(node.localName);
  node.querySelectorAll('*').forEach(element => request(element.localName));
}

function autoloader ({ elements = true, names, prefix, root = document } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (names || prefix != null) configure({ names, prefix });

  // the components bring the elements they use themselves, the page's own aufbau-* tags need the elements' autoloader
  let stopElements = null;
  let stopped      = false;
  if (elements) import('@aufbau/elements').then(({ autoloader }) => { if (!stopped) stopElements = autoloader({ root }); });

  scan(root.documentElement ?? root);

  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  observer.observe(root.body ?? root.documentElement ?? root, { childList: true, subtree: true });

  return () => {
    stopped = true;
    stopElements?.();
    observer.disconnect();
  };
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export {
  COMPONENTS,

  autoloader,
  configure,
  load,
  registerAll,
  tagOf,
};

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// lazy, elements included
import { autoloader } from '@aufbau/components';
autoloader();

// renamed
autoloader({ prefix: 'x-' });                          // <x-pick-icon>
autoloader({ names: { 'pick-icon': 'icon-field' } });  // <icon-field>

// hand picked
import '@aufbau/components/pick/language.js';

*/
