/* @aufbau/importmap.js
classic script. must be loaded before any module script.
usage: <script src="https://pulgasari.github.io/aufbau/importmap.js"></script>
*/
(() => {

const pkg = [
  'builders/docs',
  'cache',
  'elements',
  'import',
  'kits',
  'kits/preact-htm',
  'patterns',
  'plugins',
  'plugins/client',
  'plugins/vite',
  'plugins/worker',
  'shaders',
  'store',
  'stylesheet',
  'utils',
];

/*
const baseURLs  = {
  '@aufbau' : './',
  '@bunker' : 'https://pulgasari.github.io/bunker/',
  '@domina' : 'https://pulgasari.github.io/domina/',
  '@poo'    : 'https://pulgasari.github.io/poo/',
};
const importmap = {
  "htm"              : "https://esm.sh/htm@3.1.1",
  "preact"           : "https://esm.sh/preact@10.20.1",
  "preact/hooks"     : "https://esm.sh/preact@10.20.1/hooks",
  "@preact/signals"  : "https://esm.sh/@preact/signals@1.2.2?external=preact",

  '@aufbau' : ['builders/docs', 'cache', 'elements', 'import', 'js', 'kits', 'patterns', 'plugins', { plugins: ['client', 'vite', 'worker'] }, 'shaders', 'store', 'stylesheet', 'utils'],
  '@bunker' : ['cache', 'core', 'db', 'files', 'kit', 'storage'],
  '@domina' : ['core'],
};
*/

const map = { imports: {
      "htm"              : "https://esm.sh/htm@3.1.1",
      "preact"           : "https://esm.sh/preact@10.20.1",
      "preact/hooks"     : "https://esm.sh/preact@10.20.1/hooks",
      "@preact/signals"  : "https://esm.sh/@preact/signals@1.2.2?external=preact",
  
    "@aufbau/builders/docs"   : "./builders/docs/index.js",
    "@aufbau/builders/docs/"  : "./builders/docs/",
    "@aufbau/cache"           : "./cache/index.js",
    "@aufbau/elements"        : "./elements/index.js",
    "@aufbau/elements/"       : "./elements/",
    "@aufbau/import"          : "./import/index.js",
    "@aufbau/js"              : "./js/index.js",
    "@aufbau/kits"            : "./kits/aufbau.js",
    "@aufbau/kits/preact-htm" : "./kits/preact-htm.js",
    "@aufbau/patterns"        : "./patterns/index.js",
    "@aufbau/plugins"         : "./plugins/index.js",
    "@aufbau/plugins/client"  : "./plugins/client/index.js",
    "@aufbau/plugins/vite"    : "./plugins/vite/index.js",
    "@aufbau/plugins/worker"  : "./plugins/worker/index.js",
    "@aufbau/shaders"         : "./shaders/index.js",
    "@aufbau/store"           : "./store/index.js",
    "@aufbau/stylesheet"      : "./stylesheet/index.js",
    "@aufbau/stylesheet/"     : "./stylesheet/",
    "@aufbau/utils"           : "./js/index.js",

    "@bunker/cache"   : "https://pulgasari.github.io/bunker/cache/index.js",
    "@bunker/core"    : "https://pulgasari.github.io/bunker/core/index.js",
    "@bunker/db"      : "https://pulgasari.github.io/bunker/db/index.js",
    "@bunker/files"   : "https://pulgasari.github.io/bunker/files/index.js",
    "@bunker/kit"     : "https://pulgasari.github.io/bunker/kit/index.js",
    "@bunker/storage" : "https://pulgasari.github.io/bunker/storage/index.js",

    "@domina/core" : "https://pulgasari.github.io/domina/core/index.js",
    "@poo/hljs"    : "https://pulgasari.github.io/poo/hljs/index.js",

    "hljs" : "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm"
    }
  };

  const mapURL = document.currentScript?.src;
  if (!mapURL) throw new Error('[aufbau] importmap injector must be a classic script');

  // rebase relative urls against this file, not the host page
  const rebase = m => { for (const k in m) m[k] = new URL(m[k], mapURL).href; return m; };
  rebase(map.imports);
  for (const s in map.scopes ?? {}) rebase(map.scopes[s]);

  document.currentScript.after(
    Object.assign(
      document.createElement('script'), {
        type: 'importmap', 
        textContent: JSON.stringify(map)
      }
    )
  );

})();
