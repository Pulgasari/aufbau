/* fouc.js */

(() => {
  
const 
$head   = document.head,
$root   = document.documentElement,
$script = document.currentScript,
$data   = $script?.dataset,
$style  = $script?.style;

if (!$script) throw new Error('[boot] Must be executed synchronously as a classic script in <head>');

// :::::: HELPERS + REFS

const { log, warn } = console;
const on = window.addEventListener;
const SW = navigator?.serviceWorker ?? null;
  
const createElement = (tag, props) => Object.assign(document.createElement(tag), props);


// init: aufbau devtools recorder
document.write('<script src="https://code.pulgasari.dev/aufbau/devtools/recorder.js"><\/script>');

// ::: init: gestalt
const GESTALT_TOKENS = ['density', 'geometry', 'palette'];

function initGestalt ({ prefix }) {
  const slug = $data.app;
  if (!prefix || !slug) return;
  for (const token of GESTALT_TOKENS) {
    try {
      const value = JSON.parse(localStorage.getItem(`${prefix}:${slug}:${token}`));
      if (typeof value !== 'string' || !value) continue;
      $style.setProperty(`--${token}`, value);
      $data[token] = value;
    } catch {} // storage may be blocked, a stored value may be broken
  }
}

// ::: Init: Service Worker
function initService ({ path, ...options }) {
  if (path) on('load', () => SW?.register(path, options).catch(warn));
}

// hidden until ready. an app page reveals itself once its first view has settled
// (transitions.js), any other page on load. the timeout is the failsafe: an app
// that crashed on the way must not leave an empty page behind
const ready = () => { $root.classList.remove('is-loading'); $root.classList.add('is-ready'); };
$root.classList.add('is-loading');
if ($data.app) setTimeout(ready, 4000);
else on('load', ready);

const config = {
  sw: {
    path  : $data.sw      ?? '/sw.js',     // off by default — app.js registers the sw; set data-sw to enable here
    type  : $data.swType  ?? 'module',  // 'module' | 'classic'
    scope : $data.swScope ?? undefined,
  },
  gestalt: {
    prefix : $data.gestaltPrefix ?? 'zugriff',
  },
};

//initGestalt (config.gestalt);
//initService (config.sw);

$style.setProperty(`--color-bg`, 'red');
$style.setProperty(`--color-fg`, 'yellow');

// :::::: Task 0: Devtools Recorder
// @aufbau/devtools/recorder.js records console calls and failed loads from here
// on, for the devtools console that mounts much later (see its README). it has to
// run before anything else and synchronously: written in while this classic
// script runs, the parser loads and runs it right after, ahead of the rest of
// <head>. an appended <script> would load async and could come too late.
// importScripts() exists in workers only

// :::::: Task 2: Gestalt Boot (Synchronous - Prevents FOUC)
// the palette, density and geometry leaves of the app's store
// (zugriff:<slug>:<leaf>), set before the first paint. aufbau's css resolves
// everything from the tokens, so the names are all it takes
})();
