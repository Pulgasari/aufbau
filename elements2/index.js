/* @aufbau/elements2

entry point. side effect free: nothing is defined until it is used.

  autoloader()    defines each element the first time its tag shows up
  load(tag)       one element by its tag, e.g. 'svg-icon' or 'input-icon'
  registerAll()   every element at once

a tag maps onto its module:

  aufbau-<name>    ./aufbau/Aufbau<Name>.js    the building blocks, shadow dom
  input-<type>     ./input/tags.js             every input that is a type, in one module
  <group>-<name>   ./<group>/<name>.js         everything else

*/// :::: TAGS ::::::::::::::::::::::::::::::::::::::::::::::::::

const TAGS = [
  'aufbau-audio',
  'aufbau-button',
  'aufbau-code',
  'aufbau-config',
  'aufbau-crumbs',
  'aufbau-datalist',
  'aufbau-dropdown',
  'aufbau-embed',
  'aufbau-filter',
  'aufbau-index',
  'aufbau-item',
  'aufbau-keyboard',
  'aufbau-loop',
  'aufbau-modal',
  'aufbau-progress',
  'aufbau-reader',
  'aufbau-skeleton',
  'aufbau-table',
  'aufbau-toast',
  'aufbau-toc',
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

const OWN_MODULE = new Set(['input-option']);

const pascal = text => text.replace(/(?:^|-)(\w)/g, (match, letter) => letter.toUpperCase());

function pathOf (tag) {
  const [group, ...rest] = tag.split('-');
  if (group === 'aufbau')                        return `./aufbau/${pascal(tag)}.js`;
  if (group === 'input' && !OWN_MODULE.has(tag)) return './input/tags.js';
  return `./${group}/${rest.join('-')}.js`;
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

  const observer = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  observer.observe(root.body ?? root.documentElement ?? root, { childList: true, subtree: true });

  return () => observer.disconnect();
}

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export {
  TAGS,

  autoloader,
  load,
  pathOf,
  registerAll,
};

