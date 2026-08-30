// cache.js

// stylescript-owned persistence for the anti-flicker boot path. compiled css is
// written content-addressed to localStorage — the only storage a blocking boot
// script can read synchronously before the first paint. kept separate from the
// .ass path's aufbau:sheets/aufbau:pages stores on purpose.
//
// the boot-injector contract this defines (injector itself is not built yet):
//   sheet text : aufbau:stylescript:sheets:v1:<name>   -> raw compiled css
//   manifest   : aufbau:stylescript:pages:v1:<pathname> -> json [[name, hash], ...]
//   boot style : <style id="<name>" data-aufbau-script="<name>" data-aufbau-hash="<hash>">
//                (id = name so the runtime <style> upsert reconciles it in place)

const VERSION       = 'v1';
const PAGES_PREFIX  = `aufbau:stylescript:pages:${VERSION}:`;
const SHEETS_PREFIX = `aufbau:stylescript:sheets:${VERSION}:`;

// localStorage is absent under node/deno/bun/ssr and can throw in private-mode
// browsers, so every access is guarded and the core simply no-ops outside it.
function storage () {
  try   { return typeof localStorage !== 'undefined' ? localStorage : null; }
  catch { return null; }
}

const 
pathname  = () => typeof location !== 'undefined' ? location.pathname : '/',
pageKey   = (path = pathname()) => PAGES_PREFIX  + path,
sheetKey  = (name)              => SHEETS_PREFIX + name,
readSheet = (name) => storage()?.getItem(sheetKey(name)) ?? null;

function readManifest (path = pathname()) {
  const store = storage(); if (!store) return [];
  try   { return JSON.parse(store.getItem(pageKey(path)) ?? '[]'); } 
  catch { return []; }
}

// writes the compiled css and records [name, hash] in the page manifest, in adopt
// order, so a future boot.js can replay every sheet the page uses in cascade order.
function writeSheet (name, hash, css) {
  const store = storage();
  if (!store) return;

  store.setItem(sheetKey(name), css);

  const manifest = readManifest();
  const index    = manifest.findIndex(entry => entry[0] === name);

  if (index === -1) manifest.push([name, hash]);
  else              manifest[index] = [name, hash];

  store.setItem(pageKey(), JSON.stringify(manifest));
}

// :::::: EXPORT

export {
  PAGES_PREFIX,
  SHEETS_PREFIX,
  pageKey,
  sheetKey,
  readManifest,
  readSheet,
  writeSheet,
}

export const cache = { pageKey, readManifest, readSheet, sheetKey, writeSheet };
export default cache;
