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

  // document.currentScript is only readable while this script is executing
  const script = document.currentScript;

  /*
    the splash overlay, opt in with `data-splash` on the script tag. this css IS
    the mechanism — <aufbau-splash> in @aufbau/elements only decides when it goes,
    and it cannot decide anything until the module graph it covers has landed.

    reveal carries `both`, so it back-fills opacity: 0 through its delay: a boot
    that finishes inside those 180ms never shows the splash. failsafe carries
    `forwards` only, so it contributes nothing until it fills, then wins by being
    later in the list — the escape hatch for a graph that never lands at all.
    data-state="done" replaces the list and cancels the failsafe with it, so the
    component's timeout MUST stay below --aufbau-splash-limit.

    keyframes are declared here and namespaced: @aufbau/css/animations.css hangs
    off an @import in index.css and is unreachable this early.
  */
  const SPLASH = `
:root aufbau-splash{position:fixed;inset:0;z-index:var(--aufbau-splash-z,200);display:grid;place-items:center;gap:1rem;
background:var(--aufbau-bg,var(--bg,Canvas));color:var(--aufbau-fg,var(--fg,CanvasText));font:1rem/1 system-ui,sans-serif;opacity:0;
animation:aufbau-splash-reveal var(--aufbau-splash-fade,160ms) ease var(--aufbau-splash-delay,180ms) both,
aufbau-splash-failsafe 0s linear var(--aufbau-splash-limit,10s) forwards}
:root aufbau-splash[data-state="done"]{animation:aufbau-splash-dismiss var(--aufbau-splash-fade,160ms) ease both;pointer-events:none}
:root aufbau-splash[data-state="skipped"]{display:none}
@keyframes aufbau-splash-reveal{to{opacity:1}}
@keyframes aufbau-splash-dismiss{from{opacity:1}to{opacity:0;visibility:hidden}}
@keyframes aufbau-splash-failsafe{to{opacity:0;visibility:hidden;pointer-events:none}}
@media(prefers-reduced-motion:reduce){:root aufbau-splash{--aufbau-splash-fade:0s}}`;

  /*
    deliberately ahead of the storage block and in its own try/catch: that block
    returns early without a manifest (a cold visit) and can throw outright in
    private mode, and both are exactly when the splash is wanted. it reads nothing
    below <head>, issues no request, and emits one node under a THIRD attribute —
    so the data-aufbau-boot / data-aufbau-src assertions in test/flicker.test.mjs
    are untouched. landing before the cached sheets is fine, the `:root` prefix
    carries the specificity and a custom property defined later still resolves.
  */
  try {
    if (script && script.dataset.splash !== undefined) {
      const head  = document.head || document.getElementsByTagName('head')[0];
      const style = document.createElement('style');

      style.setAttribute('data-aufbau-splash', '');
      style.textContent = SPLASH;
      if (head) head.appendChild(style);
    }
  } catch (error) {
    // a splash is a nicety. never let it cost the page.
  }

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
