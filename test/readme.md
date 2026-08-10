# test

Browser tests. There is no build step, so they run against a static server and a
real Chromium via Playwright.

```sh
mkdir -p /tmp/aufbau-serve && cd /tmp/aufbau-serve
ln -s <path-to>/aufbau aufbau
ln -s <path-to>/bunker bunker
ln -s <path-to>/domina domina
python3 -m http.server 8099 --bind 127.0.0.1 &

cd <path-to>/aufbau
./test/run.sh
```

`CHROMIUM` and `ORIGIN` override the browser binary and the server origin.

## flicker.test.mjs

Proves the anti-flicker boot path end to end:

1. **Cold visit** — nothing cached. The stylesheet is fetched, compiled, and both the
   compiled CSS and the page manifest are written to localStorage.
2. **Warm visit** — the stylesheet is stalled for three seconds and the browser HTTP
   cache is disabled, so the only way to be styled is the boot path. The test asserts
   the page is already painted in the theme while the `<link>` is still in flight.
3. **After** — exactly one `<style>` remains, in the link's position, and the `<link>`
   is gone.

The HTTP cache is disabled deliberately: with it on, the browser answers the
stylesheet itself, the stall never happens and the test would pass without proving
anything.

## persist.test.mjs

Proves control persistence after moving it onto `@aufbau/store`: a `<aufbau-toggle
persist>` writes under the namespaced key, `persist="session:…"` stays out of
localStorage, both survive a reload, and `sweep()` drops an older version without
touching the current one or any foreign key.

## splash.test.mjs

Proves the initial loading screen, and deliberately does not touch
`flicker.test.mjs` — that file is the contract for boot.js's stylesheet replay and
should not grow assertions about anything else.

One page, `splash.html`, covers four scenarios through query params
(`delay`, `fade`, `limit`, `minimum`, `timeout`, plus `slow` and `hang` to stall a
gate):

1. **Slow boot** — a gate holds for 1.2 s. The overlay fades in, reaches full
   opacity, then dismisses and leaves the DOM.
2. **Fast boot** — the reveal delay is widened well past the boot so the assertion
   is about the mechanism rather than the speed of the machine. The overlay is
   *skipped*: `animationstart` never fires, nothing is ever painted over the app.
   This is the whole suppression story — no service worker probe, no cached
   timings, no heuristic.
3. **Failsafe** — the request for `AufbauSplash.js` is aborted, so no component
   code ever runs. The overlay must still clear itself, which only the CSS
   animation can do. Asserts the element is still present and still `:not(:defined)`
   while being `visibility: hidden`.
4. **Hung gate** — a gate that never settles. `ready()` gives up at its deadline,
   the report names `app` as `pending` while `elements` is `ok`, and the app is
   released regardless.

Plus one opt-out check: `flicker.html` carries no `data-splash`, so boot.js must
inject no `style[data-aufbau-splash]` there at all.
