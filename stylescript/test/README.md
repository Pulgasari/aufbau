# stylescript tests

Browser pages — open directly, no build or Node. Results print to the console and
land on `window.__results` (`[[label, pass], …]`) with `window.__ready` when done.

<https://code.pulgasari.dev/aufbau/stylescript/test/>

- **controller.html** — the controller API end to end: aliases, tokens, vars, traits
  (spread + `use`), shade strings, the deep-merge `=` setter, layered `<style id>`
  rendering with `data-aufbau-*`, cascade layer order, the `:root` vars block,
  localStorage seeding, boot-style reconciliation, and controller isolation.
  Loads the module via the hosted importmap.
- **boot.html** — self-contained (no importmap): seeds the cache, lets `boot.js`
  replay it, and asserts the page is styled from cache before the first paint.
- **index.html** — the aufbau element gallery (not stylescript-specific).
