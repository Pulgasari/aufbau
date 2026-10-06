/* shared/js/boot.js

the single classic <head> script every page loads. it replaces the old
theme-boot.js + importmap.js pair:

1. apply the stored theme to :root before first paint (no FOUC)
2. inject the framework importmap + modulepreloads
3. (optional) register a service worker

<script src="/.shared/js/boot.js"></script>

override the defaults with data-attributes or a window.__BOOT_CONFIG__ object
set before this script runs (data-sw="./sw.js" to opt back into sw here).
==================== */
(() => {
  
const currentScript = document.currentScript;
if (!currentScript) throw new Error('[boot] Must be executed synchronously as a classic script in <head>');


// :::::: HELPERS + REFS
const createElement = (tag, props) => Object.assign(document.createElement(tag), props);
const $head = document.head;
const $root = document.documentElement;

// ──────── TASKS ──────────────────────────────────

// :::::: Task 0: Devtools Recorder
// @aufbau/devtools/recorder.js records console calls and failed loads from here
// on, for the devtools console that mounts much later (see its README). it has to
// run before anything else and synchronously: written in while this classic
// script runs, the parser loads and runs it right after, ahead of the rest of
// <head>. an appended <script> would load async and could come too late.
// importScripts() exists in workers only
function initDevRecorder () {
  document.write('<script src="https://code.pulgasari.dev/aufbau/devtools/recorder.js"><\/script>');
}

initDevRecorder();

// :::::: Task 1: Dev Tools Injection | ?dev
function initDevTools (force = false) {
  try {
    const KEY = 'zugriff:devtools';
    const dev = force || new URLSearchParams(location.search).get('dev');
    if (dev !== null) {
      if (dev === 'off' || dev === '0') sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, '1');
    }
    if (sessionStorage.getItem(KEY)) {
      document.head.append(createElement('script', {
        src    : 'https://cdn.jsdelivr.net/npm/eruda@3',
        onload : () => { try { window.eruda?.init(); } catch {} },
      }));
    }
  } catch {} // storage may be blocked in incognito
}
  
// :::::: Task 2: Gestalt Boot (Synchronous - Prevents FOUC)
// the palette, density and geometry leaves of the app's store
// (zugriff:<slug>:<leaf>), set before the first paint. aufbau's css resolves
// everything from the tokens, so the names are all it takes
const GESTALT_TOKENS = ['density', 'geometry', 'palette'];

function applyGestalt ({ prefix }) {
  const slug = $root.dataset.app;
  if (!prefix || !slug) return;
  for (const token of GESTALT_TOKENS) {
    try {
      const value = JSON.parse(localStorage.getItem(`${prefix}:${slug}:${token}`));
      if (typeof value !== 'string' || !value) continue;
      $root.style.setProperty(`--${token}`, value);
      $root.dataset[token] = value;
    } catch {} // storage may be blocked, a stored value may be broken
  }
}

const { log, warn } = console;
const on = window.addEventListener;
const SW = navigator?.serviceWorker ?? null;
  
// :::::: Service Worker Registration
function registerServiceWorker ({ path, ...options }) {
  if (path) on('load', () => SW?.register(path, options).catch(warn));
}

  // :::::: Task 5: Zugriff Runtime Initialization
  // kick off the runtime import here (after the importmap is in place) and expose the
  // readiness promise so the index.html shell can await it before loading the app
  // module. binds `zugriff` (and html/toast) to window; an app never imports the runtime.
  function initRuntime () {
    window.__ZUGRIFF_READY__ = import('./runtime.js')
      .catch(error => { console.error('[boot] runtime init failed:', error); throw error; });
  }

  
  

  // hidden until ready. an app page reveals itself once its first view has settled
  // (transitions.js), any other page on load. the timeout is the failsafe: an app
  // that crashed on the way must not leave an empty page behind
  const ready = () => { $root.classList.remove('is-loading'); $root.classList.add('is-ready'); };
  $root.classList.add('is-loading');
  if ($root.dataset.app) setTimeout(ready, 4000);
  else window.addEventListener('load', ready);

  // Merge options: HTML data-attributes < global window config < default options
  const ds = currentScript.dataset;
  const userConfig = window.__BOOT_CONFIG__ || {};

  const config = {
    sw: {
      path  : ds.sw      ?? userConfig.sw      ?? '/sw.js',     // off by default — app.js registers the sw; set data-sw to enable here
      type  : ds.swType  ?? userConfig.swType  ?? 'module',  // 'module' | 'classic'
      scope : ds.swScope ?? userConfig.swScope ?? undefined,
    },
    gestalt: {
      prefix : ds.gestaltPrefix ?? userConfig.gestaltPrefix ?? 'zugriff',
    },
    preload     : userConfig.preload || [],
    imports: Object.assign(getImportMap(), userConfig.imports || {})
  };
  const { preload, sw } = config;

  // Run tasks sequentially
  initDevTools();   // eruda only behind ?dev, remembered for the tab
  applyGestalt(config.gestalt);
  injectImportMapAndPreloads(config.imports, config.preload, currentScript.src);
  registerServiceWorker(config.sw);
  initRuntime();
    
})();
