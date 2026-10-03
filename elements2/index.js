/* @aufbau/elements2

entry point. side effect free: nothing is defined until it is used.

  autoloader()    defines each element the first time its tag shows up
  load(tag)       one element by its tag, e.g. 'svg-icon' or 'input-icon'
  registerAll()   every element at once

a tag maps onto its module:

  aufbau-<name>    ./aufbau/Aufbau<Name>.js    the building blocks, shadow dom
  <group>-<name>   ./<group>/<name>.js         composed of them, light dom

*/// :::: TAGS ::::::::::::::::::::::::::::::::::::::::::::::::::

const TAGS = [
  'aufbau-audio',
  'aufbau-button',
  'aufbau-code',
  'aufbau-crumbs',
  'aufbau-datalist',
  'aufbau-dropdown',
  'aufbau-embed',
  'aufbau-filter',
  'aufbau-index',
  'aufbau-input',
  'aufbau-item',
  'aufbau-keyboard',
  'aufbau-loop',
  'aufbau-modal',
  'aufbau-option',
  'aufbau-picker',
  'aufbau-progress',
  'aufbau-reader',
  'aufbau-skeleton',
  'aufbau-slider',
  'aufbau-table',
  'aufbau-toast',
  'aufbau-toc',
  'aufbau-toggle',
  'aufbau-tree',
  'aufbau-tree-item',
  'aufbau-upload',
  'aufbau-value',
  'aufbau-video',
  'aufbau-waveform',
  'aufbau-writer',

  'app-area',
  'app-config',
  'app-float',
  'app-panel',
  'app-root',
  'app-view',

  'div-x',
  'div-y',

  'embed-bandcamp',
  'embed-mastodon',
  'embed-soundcloud',
  'embed-spotify',
  'embed-vimeo',
  'embed-youtube',

  'svg-flag',
  'svg-icon',

  'input-bool',
  'input-chips',
  'input-color',
  'input-country',
  'input-currency',
  'input-date',
  'input-datetime',
  'input-duration',
  'input-email',
  'input-emoji',
  'input-font',
  'input-hotkey',
  'input-icon',
  'input-language',
  'input-locale',
  'input-number',
  'input-option',
  'input-password',
  'input-pattern',
  'input-phone',
  'input-search',
  'input-slug',
  'input-text',
  'input-time',
  'input-timezone',
  'input-unit',
  'input-url',
  'input-value',
  'input-year',

  'write-md',
];

const known = new Set(TAGS);

const pascal = text => text.replace(/(?:^|-)(\w)/g, (match, letter) => letter.toUpperCase());

function pathOf (tag) {
  const [group, ...rest] = tag.split('-');
  return group === 'aufbau' ? `./aufbau/${pascal(tag)}.js` : `./${group}/${rest.join('-')}.js`;
}

// :::::: LOADING :::::::::::::::::::::::::::::::::::::::::::::::

let   baseURL = import.meta.url;
const loading = new Map;

function load (tag) {
  if (!known.has(tag)) return Promise.resolve(null);
  if (!loading.has(tag)) {
    const url = new URL(pathOf(tag), baseURL).href;
    loading.set(tag, import(url).catch(error => {
      console.warn(`[@aufbau/elements2] could not load <${tag}> from "${url}":`, error);
      loading.delete(tag);
      return null;
    }));
  }
  return loading.get(tag);
}

const registerAll = () => Promise.all(TAGS.map(load));

// :::::: AUTOLOADER ::::::::::::::::::::::::::::::::::::::::::::

function request (tag) {
  if (known.has(tag) && !customElements.get(tag)) load(tag);
}

function scan (node) {
  if (node?.nodeType !== Node.ELEMENT_NODE) return;
  request(node.localName);
  node.querySelectorAll('*').forEach(element => request(element.localName));
}

function autoloader ({ base, root = document } = {}) {
  if (typeof window === 'undefined') return () => {};
  if (base) baseURL = base;

  scan(root.documentElement ?? root);

  // only what got added is walked, never the whole document again
  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  observer.observe(root.body ?? root.documentElement ?? root, { childList: true, subtree: true });

  return () => observer.disconnect();
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// the core is NOT re-exported: a bare `import { autoloader }` would fetch and
// evaluate AufbauCore, the config, the skin and their dependencies before the
// first scan. the base classes and the config come from their subpaths:
//   import { AufbauElement }        from '@aufbau/elements2/core/index.js';
//   import { setConfig, getConfig } from '@aufbau/elements2/core/AufbauConfig.js';

export {
  TAGS,

  autoloader,
  load,
  pathOf,
  registerAll,
};

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

// lazy, browser first
import { autoloader } from '@aufbau/elements2';
const stop = autoloader();

// everything at once
import { registerAll } from '@aufbau/elements2';
await registerAll();

// hand picked
import '@aufbau/elements2/svg/flag.js';
import '@aufbau/elements2/input/language.js';

*/
