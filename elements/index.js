/* @aufbau/elements

entry point. side effect free: nothing is defined until it is used.

  autoloader()    defines each element the first time its tag shows up
  load(tag)       one element by its tag, e.g. 'svg-icon' or 'input-icon'
  registerAll()   every element at once

a tag maps onto its module:

  <tag>          ./webcomponents/<tag>.js
  input-<type>   ./webcomponents/input/tags.js, every input that is a type

*/// :::: TAGS ::::::::::::::::::::::::::::::::::::::::::::::::::

// a static import() per tag, so a bundler sees every module and splits them into chunks
const inputs = () => import('./webcomponents/input/tags.js');

const MODULES = {
  'aufbau-loop'       : () => import('./webcomponents/aufbau-loop.js'),
  'aufbau-progress'   : () => import('./webcomponents/aufbau-progress.js'),
  'aufbau-skeleton'   : () => import('./webcomponents/aufbau-skeleton.js'),

  'app-area'          : () => import('./webcomponents/app-area.js'),
  'app-config'        : () => import('./webcomponents/app-config.js'),
  'app-float'         : () => import('./webcomponents/app-float.js'),
  'app-panel'         : () => import('./webcomponents/app-panel.js'),
  'app-root'          : () => import('./webcomponents/app-root.js'),
  'app-view'          : () => import('./webcomponents/app-view.js'),

  'btn-chip'          : () => import('./webcomponents/btn-chip.js'),
  'btn-icon'          : () => import('./webcomponents/btn-icon.js'),
  'btn-push'          : () => import('./webcomponents/btn-push.js'),
  'btn-tap'           : () => import('./webcomponents/btn-tap.js'),

  'dash-board'        : () => import('./webcomponents/dash-board.js'),
  'dash-panel'        : () => import('./webcomponents/dash-panel.js'),

  'data-filter'       : () => import('./webcomponents/data-filter.js'),
  'data-index'        : () => import('./webcomponents/data-index.js'),
  'data-item'         : () => import('./webcomponents/data-item.js'),
  'data-list'         : () => import('./webcomponents/data-list.js'),
  'data-node'         : () => import('./webcomponents/data-node.js'),
  'data-table'        : () => import('./webcomponents/data-table.js'),
  'data-tree'         : () => import('./webcomponents/data-tree.js'),

  'div-x'             : () => import('./webcomponents/div-x.js'),
  'div-y'             : () => import('./webcomponents/div-y.js'),

  'embed-bandcamp'    : () => import('./webcomponents/embed-bandcamp.js'),
  'embed-content'     : () => import('./webcomponents/embed-content.js'),
  'embed-mastodon'    : () => import('./webcomponents/embed-mastodon.js'),
  'embed-soundcloud'  : () => import('./webcomponents/embed-soundcloud.js'),
  'embed-spotify'     : () => import('./webcomponents/embed-spotify.js'),
  'embed-vimeo'       : () => import('./webcomponents/embed-vimeo.js'),
  'embed-youtube'     : () => import('./webcomponents/embed-youtube.js'),

  'input-bool'        : inputs,
  'input-chips'       : inputs,
  'input-color'       : inputs,
  'input-country'     : inputs,
  'input-currency'    : inputs,
  'input-date'        : inputs,
  'input-datetime'    : inputs,
  'input-duration'    : inputs,
  'input-email'       : inputs,
  'input-emoji'       : inputs,
  'input-address'     : () => import('./webcomponents/input-address.js'),
  'input-file'        : () => import('./webcomponents/input-file.js'),
  'input-font'        : inputs,
  'input-hotkey'      : inputs,
  'input-icon'        : inputs,
  'input-language'    : inputs,
  'input-locale'      : inputs,
  'input-number'      : inputs,
  'input-option'      : () => import('./webcomponents/input-option.js'),
  'input-password'    : inputs,
  'input-pattern'     : inputs,
  'input-phone'       : inputs,
  'input-search'      : inputs,
  'input-slug'        : inputs,
  'input-text'        : inputs,
  'input-time'        : inputs,
  'input-timezone'    : inputs,
  'input-unit'        : inputs,
  'input-url'         : inputs,
  'input-value'       : inputs,
  'input-year'        : inputs,

  'media-audio'       : () => import('./webcomponents/media-audio.js'),
  'media-file'        : () => import('./webcomponents/media-file.js'),
  'media-font'        : () => import('./webcomponents/media-font.js'),
  'media-gif'         : () => import('./webcomponents/media-gif.js'),
  'media-json'        : () => import('./webcomponents/media-json.js'),
  'media-pdf'         : () => import('./webcomponents/media-pdf.js'),
  'media-svg'         : () => import('./webcomponents/media-svg.js'),
  'media-video'       : () => import('./webcomponents/media-video.js'),
  'media-wave'        : () => import('./webcomponents/media-wave.js'),

  'mock-img'          : () => import('./webcomponents/mock-img.js'),
  'mock-p'            : () => import('./webcomponents/mock-p.js'),

  'nav-crumbs'        : () => import('./webcomponents/nav-crumbs.js'),
  'nav-initials'      : () => import('./webcomponents/nav-initials.js'),
  'nav-paginate'      : () => import('./webcomponents/nav-paginate.js'),
  'nav-toc'           : () => import('./webcomponents/nav-toc.js'),

  'output-md'         : () => import('./webcomponents/output-md.js'),
  'output-value'      : () => import('./webcomponents/output-value.js'),

  'pop-menu'          : () => import('./webcomponents/pop-menu.js'),
  'pop-modal'         : () => import('./webcomponents/pop-modal.js'),
  'pop-over'          : () => import('./webcomponents/pop-over.js'),
  'pop-prompt'        : () => import('./webcomponents/pop-prompt.js'),
  'pop-tip'           : () => import('./webcomponents/pop-tip.js'),
  'pop-toast'         : () => import('./webcomponents/pop-toast.js'),

  'svg-file'          : () => import('./webcomponents/svg-file.js'),
  'svg-flag'          : () => import('./webcomponents/svg-flag.js'),
  'svg-icon'          : () => import('./webcomponents/svg-icon.js'),
  'svg-logo'          : () => import('./webcomponents/svg-logo.js'),
  'svg-sprite'        : () => import('./webcomponents/svg-sprite.js'),

  'widget-calculator' : () => import('./webcomponents/widget-calculator.js'),
  'widget-keyboard'   : () => import('./webcomponents/widget-keyboard.js'),

  'write-code'        : () => import('./webcomponents/write-code.js'),
  'write-md'          : () => import('./webcomponents/write-md.js'),
  'write-text'        : () => import('./webcomponents/write-text.js'),
};

const TAGS = Object.keys(MODULES);

const known = new Set(TAGS);

const OWN_FILE = new Set(['input-address', 'input-file', 'input-option']);

// the inputs that are a type and nothing more share one module
function pathOf (tag) {
  if (tag.startsWith('input-') && !OWN_FILE.has(tag)) return './webcomponents/input/tags.js';
  return `./webcomponents/${tag}.js`;
}

// :::::: LOADING :::::::::::::::::::::::::::::::::::::::::::::::

let   baseURL = null;
const loading = new Map;

function load (tag) {
  if (!known.has(tag)) return Promise.resolve(null);
  if (!loading.has(tag)) {
    // autoloader({ base }) loads from elsewhere, past the bundler
    const url = baseURL && new URL(pathOf(tag), baseURL).href;
    loading.set(tag, (url ? import(/* @vite-ignore */ url) : MODULES[tag]()).catch(error => {
      console.warn(`[@aufbau/elements] could not load <${tag}> from "${url ?? pathOf(tag)}":`, error);
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

