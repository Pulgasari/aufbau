// aufbau/www :: boot

/*
what the pages of this site set up before they show anything, the part of
the former @aufbau/api they used: aufbau.css, the gestalt look, the elements
(autoloaded), the fonts.

  import { boot, gestalt, load } from './boot.js';

  await boot();                                         // defaults below
  await boot({ css: { palette: 'petrol' }, font: ['manrope', 'jetbrains-mono'] });
  await load('pop-toast', 'pop-prompt');                // elements right away, not when they show up
*/

import { autoloader, load as loadElement, registerAll } from '@aufbau/elements';
import { CSS_PATH, gestalt }                            from '@gestalt/core';
import webfonts                                         from '@gestalt/webfonts';
import { setConfig }                                    from '@domina/element';

const DEFAULTS = {
  // reset is css/aufbau.css, which brings the gestalt tokens and the palettes along.
  // false when the page links it itself
  css      : { layout: false, look: 'flat', mode: null, palette: null, reset: true, skin: 'monochrome' },
  // mode: 'auto' | 'all' | false. every other key is element config, e.g. { 'write-code': { theme: 'nord' } }
  elements : { mode: 'auto' },
  font     : ['manrope'],
};

// a real <link>: aufbau.css imports its parts into layers, which an adopted sheet cannot.
// first in <head>, so the page's own sheets come after it
function linkStylesheet (href) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    document.head.prepend(Object.assign(document.createElement('link'), { href, onerror: reject, onload: resolve, rel: 'stylesheet' }));
  });
}

let booted = null;

// once per page, a second call gets the first one's promise
function boot ({ css = {}, elements = {}, font = DEFAULTS.font } = {}) {
  return booted ??= (async () => {
    const { layout, look, mode: scheme, palette, reset, skin } = { ...DEFAULTS.css, ...css };
    const { mode, ...config }                                  = { ...DEFAULTS.elements, ...elements };

    if (reset) await linkStylesheet(`${CSS_PATH}/aufbau.css`);
    if (Object.keys(config).length) setConfig(config);

    await Promise.all([
      gestalt.set({ layout, look, mode: scheme, skin, ...(palette && { palette }) }),
      mode === 'auto' && autoloader(),
      mode === 'all'  && registerAll(),
      font && webfonts.init(font),
    ]);
  })();
}

const load = (...tags) => Promise.all(tags.map(loadElement));

// :::::: EXPORT

export { boot, gestalt, load, setConfig };
