// stylescript/boot.js
//
// classic, blocking, first-in-<head> script. it replays the compiled css that
// stylescript cached on a previous visit, injecting it as <style> elements BEFORE
// the first paint — so a warm visit is already styled while the module graph that
// would rebuild those sheets is still loading.
//
// a classic script has no imports, so the keyspace below is the hand-kept twin of
// stylescript/cache.js. the two must move together.
//
// usage: <script src="/aufbau/stylescript/boot.js"></script> as the first element
// in <head>, ahead of the module that adopts the sheets.

(function () {
  'use strict';

  var PAGES_PREFIX  = 'aufbau:stylescript:pages:v1:';
  var SHEETS_PREFIX = 'aufbau:stylescript:sheets:v1:';

  var store;
  try { store = window.localStorage; } catch (error) { return; }
  if (!store) return;

  var manifest;
  try { manifest = JSON.parse(store.getItem(PAGES_PREFIX + location.pathname) || '[]'); }
  catch (error) { return; }
  if (!manifest || !manifest.length) return;

  var head = document.head || document.getElementsByTagName('head')[0];
  if (!head) return;

  // inject each cached sheet in manifest (adopt) order so the cascade matches.
  for (var i = 0; i < manifest.length; i++) {
    var name = manifest[i][0];
    var hash = manifest[i][1];
    if (!name || document.getElementById(name)) continue;

    var css = store.getItem(SHEETS_PREFIX + name);
    if (css == null) continue;

    var style = document.createElement('style');
    style.id  = name;
    style.setAttribute('data-aufbau-script', name);
    style.setAttribute('data-aufbau-hash', hash || '');
    style.setAttribute('data-aufbau-boot', '');
    style.textContent = css;
    head.appendChild(style);
  }
})();
