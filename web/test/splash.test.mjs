/*
  proves the splash path: it appears when there is a gap, it does NOT appear when
  there is none, and it goes away even when nothing works.

  same setup as flicker.test.mjs — a static server rooted so that /aufbau, /bunker
  and /domina resolve:

    ln -s <aufbau> serve/aufbau; ln -s <domina> serve/domina
    python3 -m http.server 8099 --bind 127.0.0.1
    node test/splash.test.mjs

  kept separate from flicker.test.mjs on purpose. that file is the contract for
  boot.js's stylesheet replay and must not grow assertions about anything else.
*/

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const CHROMIUM = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ORIGIN   = process.env.ORIGIN ?? 'http://127.0.0.1:8099';
const PAGE     = `${ORIGIN}/aufbau/test/splash.html`;
const ELEMENT  = '**/AufbauSplash.js';

const browser = await chromium.launch({ executablePath: CHROMIUM });

const visit = async (query, route) => {
  const context = await browser.newContext();
  const page    = await context.newPage();

  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));

  if (route) await context.route(...route);
  await page.goto(`${PAGE}${query}`, { waitUntil: 'load' });

  return { context, errors, page };
};

// :::::: 1. a real gap — the splash reveals, covers, and is gone afterwards

{
  const { context, errors, page } = await visit('?slow=1200&delay=60ms');

  // reveals fires when the fade STARTS, so wait for it to finish before sampling
  await page.waitForFunction(() => window.__splash.reveals === 1, null, { timeout: 3000 });
  await page.waitForFunction(() => window.__opacity() === '1', null, { timeout: 3000 });

  await page.waitForFunction(() => window.__splash.done !== null, null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__splash.done), 'done', 'and dismissed rather than skipped');

  await page.waitForFunction(() => document.querySelector('aufbau-splash') === null, null, { timeout: 3000 });
  assert.deepEqual(errors, [], 'no page errors');

  await context.close();
  console.log('  slow boot     : revealed, then removed');
}

// :::::: 2. no gap — the reveal delay means it is never seen at all
//
// this is the whole suppression story. no service worker probe, no cached timing
// history, no heuristic: if the app beats the delay, nothing ever appears.
//
// the delay is widened rather than left at its 180ms default so the assertion is
// about the mechanism and not about how fast the machine running the test is.

{
  const { context, errors, page } = await visit('?delay=5s');

  await page.waitForFunction(() => window.__splash.done !== null, null, { timeout: 5000 });

  const splash = await page.evaluate(() => window.__splash);
  assert.equal(splash.done,    'skipped', 'fast boot: skipped outright');
  assert.equal(splash.reveals, 0,         'and the reveal animation never started');
  assert.deepEqual(errors, [], 'no page errors');

  await context.close();
  console.log('  fast boot     : never revealed, skipped');
}

// :::::: 3. the component never arrives — pure css has to clear the overlay
//
// aborting the element module is the honest version of "the module graph failed".
// nothing in @aufbau/elements ever runs for <aufbau-splash>, so whatever clears
// the screen here is css and only css.

{
  const { context, page } = await visit(
    '?delay=60ms&limit=800ms',
    [ELEMENT, route => route.abort()]
  );

  await page.waitForFunction(() => window.__splash.reveals === 1, null, { timeout: 3000 });
  await page.waitForFunction(() => window.__hidden(), null, { timeout: 3000 });

  const state = await page.evaluate(() => ({
    done    : window.__splash.done,
    present : document.querySelector('aufbau-splash') !== null,
    upgraded: document.querySelector('aufbau-splash').matches(':defined'),
  }));

  assert.equal(state.present,  true,  'failsafe: the element is still in the dom');
  assert.equal(state.upgraded, false, 'and was never upgraded, so no component js ran');
  assert.equal(state.done,     null,  'nothing dismissed it — the css animation did');

  await context.close();
  console.log('  failsafe      : css alone cleared it');
}

// :::::: 4. a gate that never settles — the barrier gives up and says what hung

{
  const { context, page } = await visit('?hang=1&delay=60ms&timeout=700');

  await page.waitForFunction(() => window.__splash.done !== null, null, { timeout: 5000 });

  const splash = await page.evaluate(() => window.__splash);
  assert.equal(splash.timeout?.app, 'pending', 'timeout: the report names the gate that hung');
  assert.equal(splash.timeout?.elements, 'ok', 'while the gates that did settle are reported settled');
  assert.equal(splash.done, 'done', 'and the app was released anyway');

  await context.close();
  console.log('  hung gate     : reported and released');
}

// :::::: 5. without data-splash, boot.js must behave exactly as it always has

{
  const context = await browser.newContext();
  const page    = await context.newPage();

  await page.goto(`${ORIGIN}/aufbau/test/flicker.html`, { waitUntil: 'load' });
  const styles = await page.evaluate(() => document.querySelectorAll('style[data-aufbau-splash]').length);

  assert.equal(styles, 0, 'no data-splash: boot.js injects nothing');

  await context.close();
  console.log('  opt-out       : boot.js untouched');
}

console.log('splash: all assertions passed');

await browser.close();
