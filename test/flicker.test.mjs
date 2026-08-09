/*
  proves the anti-flicker boot path.

  needs a static server rooted so that /aufbau, /bunker and /domina resolve:

    ln -s <aufbau> serve/aufbau; ln -s <bunker> serve/bunker; ln -s <domina> serve/domina
    python3 -m http.server 8099 --bind 127.0.0.1
    node test/flicker.test.mjs

  the browser http cache is disabled for the second visit on purpose. otherwise it
  answers the stylesheet itself and the stall never happens, which would make the
  test pass without proving anything.
*/

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const CHROMIUM = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ORIGIN   = process.env.ORIGIN ?? 'http://127.0.0.1:8099';
const PAGE     = `${ORIGIN}/aufbau/test/flicker.html`;
const SHEET    = '**/flicker.ass';
const THEME    = 'rgb(17, 34, 51)';

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext();
const page    = await context.newPage();

const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => {
  // the favicon 404 is the static server's, not ours
  if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text());
});

// :::::: visit 1 — cold. nothing cached anywhere.

let coldRequests = 0;
await context.route(SHEET, async (route) => { coldRequests++; await route.continue(); });

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true);
await page.waitForFunction(() => document.querySelector('style[data-aufbau-src]') !== null);

assert.equal(await page.evaluate(() => window.__probe.bootStyles), 0, 'cold visit: nothing to boot from');

/*
  two requests, not one: the browser downloads the <link> itself, and the client
  plugin fetches the same url again because a .ass file's source is not reachable
  through document.styleSheets.

  inherent to compiling on the client. the service worker path does not pay it —
  there the link's own request is answered with compiled css.
*/
assert.equal(coldRequests, 2, 'cold visit: the <link> download plus the plugin fetch');

const panel = await page.evaluate(() => {
  const style = getComputedStyle(document.querySelector('#panel'));
  return { display: style.display, placeItems: style.placeItems };
});
assert.equal(panel.display, 'grid', 'aufbau-center compiled to a grid');
assert.match(panel.placeItems, /center/, 'and to place-items: center');

const stored = await page.evaluate(() => ({
  manifest : localStorage.getItem('aufbau:pages:v1:/aufbau/test/flicker.html'),
  sheet    : localStorage.getItem('aufbau:sheets:v1:./flicker.ass'),
}));
assert.deepEqual(JSON.parse(stored.manifest), ['./flicker.ass'], 'the page manifest was written');
assert.ok(stored.sheet.includes('place-items'), 'the stored css is compiled');
assert.ok(!stored.sheet.includes('aufbau-center'), 'and not the raw ass source');

// :::::: visit 2 — warm localStorage, cold http cache, stylesheet stalled 3s.
// this is the test. without the boot path the page is unstyled for the full stall.

const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

let stalled = 0;
await context.unroute(SHEET);
await context.route(SHEET, async (route) => {
  stalled++;
  await new Promise(resolve => setTimeout(resolve, 3000));
  await route.continue();
});

const navigation = page.goto(PAGE, { waitUntil: 'load' });

await page.waitForFunction(() => window.__bodyProbe !== undefined, null, { timeout: 5000 });
const early = await page.evaluate(() => window.__bodyProbe);

assert.equal(early.bootStyles, 1, 'warm visit: boot.js injected the cached stylesheet');
assert.equal(early.probe, 'cached', 'its custom property resolved before the <link> did');
assert.equal(early.background, THEME, 'and the body was already painted in the theme');
assert.equal(early.linkResolved, false, 'while the real stylesheet was still stalled');

await navigation;

// :::::: after the stalled sheet finally lands, exactly one copy must remain

await page.waitForFunction(() => window.__ready === true);
await page.waitForFunction(() => document.querySelector('style[data-aufbau-src]') !== null);

const settled = await page.evaluate(() => ({
  background : getComputedStyle(document.body).backgroundColor,
  boot       : document.querySelectorAll('style[data-aufbau-boot]').length,
  links      : document.querySelectorAll('link[rel="stylesheet"]').length,
  styles     : document.querySelectorAll('style[data-aufbau-src], style[data-aufbau-boot]').length,
}));

assert.equal(settled.styles, 1, 'the boot style was moved into place, not duplicated');
assert.equal(settled.boot, 0, 'and re-tagged as a processed stylesheet');
assert.equal(settled.links, 0, 'the original <link> is gone');
assert.equal(settled.background, THEME, 'the page is styled');

assert.deepEqual(errors, [], 'no page errors');

console.log('flicker: all assertions passed');
console.log(`  cold visit: ${coldRequests} sheet requests, warm visit: ${stalled} (stalled 3s)`);
console.log('  styled before the stylesheet arrived, single copy afterwards');

await browser.close();
