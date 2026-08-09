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
