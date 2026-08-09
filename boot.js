/* @aufbau/boot.js

classic script, deliberately dependency-free and deliberately blocking.

it must run BEFORE the stylesheet links it covers, so it goes first in <head>:

  <script src="https://pulgasari.github.io/aufbau/boot.js"></script>
  <link rel="stylesheet" href="./app.ass">

not type="module", not defer, not async — all three defer execution past the
parser, which is precisely the window in which the page flashes unstyled.

localStorage is the only web storage api that can be read synchronously, so it is
the only one that can put styles on the page before the first paint. that is the
entire reason this file exists.

the key layout mirrors @aufbau/store (see BOOT_KEYS there). this script cannot
import it — a classic script has no imports — so the two are kept in step by hand.
*/
(() => {

  const PAGES  = 'aufbau:pages:v1:';
  const SHEETS = 'aufbau:sheets:v1:';

  // everything here is best effort. a boot script that throws would take the page
  // down over a cache miss, which is a far worse outcome than a moment of flicker.
  try {
    const store = window.localStorage;
    if (!store) return;

    // boot.js runs before the <link> elements are parsed, so the dom cannot tell it
    // which sheets this page uses. the manifest, written on the previous visit, can.
    const manifest = store.getItem(PAGES + location.pathname);
    if (!manifest) return;

    const hrefs = JSON.parse(manifest);
    if (!Array.isArray(hrefs)) return;

    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    const booted = [];

    for (let index = 0; index < hrefs.length; index++) {
      const href = hrefs[index];
      const css  = store.getItem(SHEETS + href);
      if (!css) continue;

      // appended in manifest order, which is the order the links appear in. the
      // client plugin later moves each of these into its link's exact position, so
      // the final cascade matches an uncached load rather than merely resembling it.
      const style = document.createElement('style');
      style.setAttribute('data-aufbau-boot', href);
      style.textContent = css;
      head.appendChild(style);
      booted.push(href);
    }

    if (!booted.length) return;

    /*
      the styles alone are not enough. the <link> we just pre-empted is still
      coming, and it does two harmful things:

        1. it is render-blocking, so the browser paints NOTHING until it arrives —
           the cached css would sit there unused behind a blank page.
        2. an .ass file is close enough to css that the browser parses and applies
           it, and it lands after our <style> in the cascade. raw aufbau-* rules
           would win over the compiled ones. that is the flicker, not its cure.

      so each pre-empted link gets media="not all" the moment it is inserted, which
      makes it neither render-blocking nor applicable. the request is already in
      flight by then and stays in flight — the client plugin uses it to revalidate.

      a MutationObserver callback runs at the next microtask checkpoint, long before
      a network response can land, so this always wins the race.
    */
    const pending = new Set(booted);

    const disarm = (node) => {
      if (node.tagName !== 'LINK' || node.rel !== 'stylesheet') return;
      const href = node.getAttribute('href');
      if (!pending.has(href)) return;

      node.media = 'not all';
      node.setAttribute('data-aufbau-superseded', href);
      pending.delete(href);
    };

    const observer = new MutationObserver((mutations) => {
      for (let m = 0; m < mutations.length; m++) {
        const added = mutations[m].addedNodes;
        for (let n = 0; n < added.length; n++) if (added[n].nodeType === 1) disarm(added[n]);
      }
      if (!pending.size) observer.disconnect();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // the parser is done long before load, but stop watching regardless
    window.addEventListener('DOMContentLoaded', () => observer.disconnect(), { once: true });
  } catch (error) {
    // private mode, a blocked cookie policy, a corrupt entry. nothing to do but
    // let the normal stylesheet load take over.
  }
})();
