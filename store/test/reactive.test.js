// @aufbau/store reactive core. run: node --test

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { batch, computed, effect, signal, untracked } from '../reactive.js';

test('signal reads, writes and peeks', () => {
  const s = signal(1);
  assert.equal(s.value, 1);
  s.value = 2;
  assert.equal(s.value, 2);
  assert.equal(s.peek(), 2);
});

test('effect runs immediately and on dependency change; dispose stops it', () => {
  const s = signal(0);
  const seen = [];
  const dispose = effect(() => seen.push(s.value));
  assert.deepEqual(seen, [0]);
  s.value = 1;
  s.value = 2;
  assert.deepEqual(seen, [0, 1, 2]);
  dispose();
  s.value = 3;
  assert.deepEqual(seen, [0, 1, 2]);
});

test('effect cleanup runs before each re-run and on dispose', () => {
  const s = signal(0);
  let cleanups = 0;
  const dispose = effect(() => { s.value; return () => cleanups++; });
  s.value = 1;            // cleanup before re-run
  assert.equal(cleanups, 1);
  dispose();             // cleanup on dispose
  assert.equal(cleanups, 2);
});

test('computed memoizes and tracks', () => {
  const s = signal(2);
  let runs = 0;
  const c = computed(() => { runs++; return s.value * 10; });
  assert.equal(c.value, 20);
  assert.equal(c.value, 20);   // cached, not recomputed
  assert.equal(runs, 1);
  s.value = 3;
  assert.equal(c.value, 30);
  assert.equal(runs, 2);
});

test('diamond: an effect reading a signal and a computed of it runs once per change', () => {
  const a = signal(1);
  const c = computed(() => a.value * 2);
  let runs = 0;
  effect(() => { a.value; c.value; runs++; });
  assert.equal(runs, 1);
  a.value = 2;
  assert.equal(runs, 2);   // not 3
});

test('batch collapses notifications', () => {
  const a = signal(1);
  const b = signal(1);
  let runs = 0;
  effect(() => { a.value; b.value; runs++; });
  assert.equal(runs, 1);
  batch(() => { a.value = 2; b.value = 2; });
  assert.equal(runs, 2);   // one flush for both writes
});

test('untracked reads without subscribing', () => {
  const s = signal(0);
  let runs = 0;
  effect(() => { untracked(() => s.value); runs++; });
  s.value = 1;
  assert.equal(runs, 1);   // never re-ran
});
