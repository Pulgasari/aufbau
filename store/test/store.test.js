// @aufbau/store integration. run: node --test

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { store } from '../index.js';

const make = () => store({
  dark  : false,
  view  : { type: 'enum', values: ['grid', 'list', 'columns'] },
  zoom  : { value: 100, min: 50, max: 200 },
  title : 'My App',
  tags  : { type: 'list', value: ['a'] },
});

test('bare access reads and writes the value (pure C)', () => {
  const ui = make();
  assert.equal(ui.dark, false);
  assert.equal(ui.view, 'grid');
  ui.dark = true;
  assert.equal(ui.dark, true);
  assert.equal(typeof ui.dark, 'boolean');   // real primitive, no wrapper
});

test('string-keyed get/set verbs mirror bare access', () => {
  const ui = make();
  ui.set('zoom', 150);
  assert.equal(ui.get('zoom'), 150);
  assert.equal(ui.zoom, 150);
});

test('typed method verbs', () => {
  const ui = make();
  assert.equal(ui.toggle('dark'), true);
  assert.equal(ui.cycle('view'), 'list');
  assert.equal(ui.inc('zoom', 80), 180);
  assert.equal(ui.clamp('zoom'), 180);       // within bounds
  assert.equal(ui.inc('zoom', 999) && ui.clamp('zoom'), 200);
  assert.equal(ui.toKebab('title'), 'my-app');
  ui.push('tags', 'b');
  assert.deepEqual(ui.tags, ['a', 'b']);
  assert.equal(ui.has('tags', 'a'), true);
});

test('reset returns a key (or all) to its init value', () => {
  const ui = make();
  ui.dark = true; ui.set('zoom', 200);
  ui.reset('dark');
  assert.equal(ui.dark, false);
  ui.reset();
  assert.equal(ui.zoom, 100);
});

test('onChange fires on change, not initially, and dispose stops it', () => {
  const ui = make();
  const seen = [];
  const off = ui.onChange('dark', v => seen.push(v));
  assert.deepEqual(seen, []);        // no initial call
  ui.dark = true;
  ui.dark = false;
  assert.deepEqual(seen, [true, false]);
  off();
  ui.dark = true;
  assert.deepEqual(seen, [true, false]);
});

test('keys and snapshot', () => {
  const ui = make();
  ui.toggle('dark'); ui.cycle('view');
  assert.deepEqual(ui.keys, ['dark', 'view', 'zoom', 'title', 'tags']);
  assert.deepEqual(ui.snapshot(), { dark: true, view: 'list', zoom: 100, title: 'My App', tags: ['a'] });
});

test('define adds a typed key at runtime, delete removes it', () => {
  const ui = make();
  ui.define('route', '/home');
  assert.equal(ui.route, '/home');
  ui.set('route', '/about');
  assert.equal(ui.route, '/about');
  ui.delete('route');
  assert.equal(ui.route, undefined);
  assert.ok(!ui.keys.includes('route'));
});

test('a key named like a verb is rejected', () => {
  assert.throws(() => store({ toggle: false }), /reserved verb/);
  assert.throws(() => store({ set: 1 }), /reserved verb/);
});

test('enum ignores off-list writes', () => {
  const ui = make();
  ui.view = 'nope';
  assert.equal(ui.view, 'grid');   // unchanged
  ui.view = 'list';
  assert.equal(ui.view, 'list');
});

test('derived leaf recomputes from other keys', () => {
  const ui = store({
    first : 'ada',
    last  : 'lovelace',
    full  : s => `${s.first} ${s.last}`,
  });
  assert.equal(ui.full, 'ada lovelace');
  ui.first = 'grace';
  assert.equal(ui.full, 'grace lovelace');
});

test('per-key persistence: hydrate a fresh store from a backing { get, set }', () => {
  const mem = new Map();
  const backing = { get: k => (mem.has(k) ? mem.get(k) : undefined), set: (k, v) => mem.set(k, v) };

  const a = store({ dark: false, n: 1 }, { key: 't', persist: backing });
  assert.equal(mem.size, 0);           // seed is never written before a change

  a.dark = true; a.set('n', 5);
  assert.equal(mem.get('t:dark'), true);
  assert.equal(mem.get('t:n'), 5);

  const b = store({ dark: false, n: 1 }, { key: 't', persist: backing });
  assert.equal(b.dark, true);          // hydrated
  assert.equal(b.n, 5);
});
