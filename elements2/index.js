/* @aufbau/elements2

entry point. side effect free: nothing is defined until it is used.

  autoloader()    defines each element the first time its tag shows up
  load(tag)       one element by its tag, e.g. 'svg-icon' or 'input-icon'
  registerAll()   every element at once

a tag maps onto its module:

  <tag>          ./webcomponents/<tag>.js
  input-<type>   ./webcomponents/input/tags.js, every input that is a type

*/// :::: TAGS ::::::::::::::::::::::::::::::::::::::::::::::::::

const TAGS = [
  'aufbau-audio',
  'aufbau-code',
  'aufbau-datalist',
  'aufbau-dropdown',
  'aufbau-embed',
  'aufbau-filter',
  'aufbau-index',
  'aufbau-item',
  'aufbau-loop',
  'aufbau-progress',
  'aufbau-reader',
  'aufbau-skeleton',
  'aufbau-toast',
  'aufbau-value',
  'aufbau-video',
  'aufbau-waveform',

  'app-area',
  'app-config',
  'app-float',
  'app-keyboard',
  'app-modal',
  'app-panel',
  'app-root',
  'app-view',

  'btn-icon',
  'btn-push',
  'btn-tap',

  'data-table',
  'data-tree',
  'data-tree-item',

  'div-x',
  'div-y',

  'embed-bandcamp',
  'embed-mastodon',
  'embed-soundcloud',
  'embed-spotify',
  'embed-vimeo',
  'embed-youtube',

  'nav-crumbs',
  'nav-toc',

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
  'input-file',
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
  'write-text',
];

const known = new Set(TAGS);

const OWN_FILE = new Set(['input-file', 'input-option']);

// the inputs that are a type and nothing more share one module
function pathOf (tag) {
  if (tag.startsWith('input-') && !OWN_FILE.has(tag)) return './webcomponents/input/tags.js';
  return `./webcomponents/${tag}.js`;
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

