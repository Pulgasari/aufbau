/*
  proves control persistence still works end to end after moving it onto
  @aufbau/store. see test/readme.md for the server setup.
*/

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const CHROMIUM = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ORIGIN   = process.env.ORIGIN ?? 'http://127.0.0.1:8099';
const PAGE     = `${ORIGIN}/aufbau/test/persist.html`;

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext();
const page    = await context.newPage();

const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

const ready  = () => page.waitForFunction(() => window.__ready === true);
const local  = (key) => page.evaluate(k => localStorage.getItem(k), key);
const tab    = (key) => page.evaluate(k => sessionStorage.getItem(k), key);
const toggle = (id) => page.evaluate((i) => {
  const element = document.querySelector(i);
  element.setChecked(!element.checked);
  return element.checked;
}, id);

await page.goto(PAGE, { waitUntil: 'load' });
await ready();

/*
  a toggle's persisted state is String(checked), so `false` is a real value and
  gets written on connect. controls whose state is the empty string — inputs,
  writers — are skipped until they hold something, otherwise merely putting
  `persist` on one would fill storage with "".
*/
assert.equal(await local('aufbau:v1:dark'), '"false"', 'the toggle stored its initial state');
assert.equal(await local('aufbau:v1:loose'), null, 'a control without `persist` stores nothing');

// :::::: a change is written under the namespaced key
assert.equal(await toggle('#dark'), true);
assert.equal(await local('aufbau:v1:dark'), '"true"', 'the change landed in the aufbau keyspace');

// :::::: session:<key> goes to sessionStorage only
assert.equal(await toggle('#beta'), true);
assert.equal(await tab('aufbau:v1:beta'), '"true"');
assert.equal(await local('aufbau:v1:beta'), null, 'a session control must not touch localStorage');

// :::::: state comes back on reload
await page.reload({ waitUntil: 'load' });
await ready();

assert.equal(await page.evaluate(() => document.querySelector('#dark').checked), true,
  'localStorage state survived the reload');
assert.equal(await page.evaluate(() => document.querySelector('#beta').checked), true,
  'sessionStorage state survived the reload');
assert.equal(await page.evaluate(() => document.querySelector('#loose').checked), false,
  'the unpersisted control came back at its default');

// :::::: turning it back off persists the clear too
assert.equal(await toggle('#dark'), false);
assert.equal(await local('aufbau:v1:dark'), '"false"', 'clearing is persisted, not skipped');

// :::::: sweep drops an older version and leaves everything else alone
await page.evaluate(() => {
  localStorage.setItem('aufbau:v0:ancient', '"stale"');
  localStorage.setItem('unrelated:key', 'keep me');
});

const swept = await page.evaluate(async () => (await import('@aufbau/store')).sweep());

assert.ok(swept >= 1, 'sweep removed the stale entry');
assert.equal(await local('aufbau:v0:ancient'), null);
assert.equal(await local('aufbau:v1:dark'), '"false"', 'the current version survives');
assert.equal(await local('unrelated:key'), 'keep me', 'foreign keys survive');

assert.deepEqual(errors, [], 'no page errors');

console.log('persist: all assertions passed');
await browser.close();
