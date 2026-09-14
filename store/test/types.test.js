// @aufbau/store type registry (pure). run: node --test

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TYPES, describe, inferType } from '../types.js';

test('inferType maps literals to types', () => {
  assert.equal(inferType(false), 'bool');
  assert.equal(inferType(3),     'number');
  assert.equal(inferType('x'),   'string');
  assert.equal(inferType([]),    'list');
  assert.equal(inferType(() => {}), 'derived');
  assert.equal(inferType({}),    'ref');
});

test('describe normalizes bare values and config objects', () => {
  assert.deepEqual(describe(false), { type: 'bool', init: false, spec: {} });
  assert.deepEqual(describe('hi'),  { type: 'string', init: 'hi', spec: {} });

  const num = describe({ value: 100, min: 50, max: 200 });
  assert.equal(num.type, 'number');
  assert.equal(num.init, 100);

  const enumFull = describe({ type: 'enum', value: 'list', values: ['grid', 'list'] });
  assert.equal(enumFull.type, 'enum');
  assert.equal(enumFull.init, 'list');

  const enumShort = describe({ type: 'enum', values: ['grid', 'list'] });
  assert.equal(enumShort.init, 'grid');   // first item is the implicit init

  const enumInferred = describe({ values: ['on', 'off'] });
  assert.equal(enumInferred.type, 'enum');
  assert.equal(enumInferred.init, 'on');
});

test('coercions per type', () => {
  assert.equal(TYPES.bool.coerce(1), true);
  assert.equal(TYPES.number.coerce('5'), 5);
  assert.equal(TYPES.string.coerce(null), '');
  assert.equal(TYPES.enum.coerce('list', { values: ['grid', 'list'] }, 'grid'), 'list');
  assert.equal(TYPES.enum.coerce('nope', { values: ['grid', 'list'] }, 'grid'), 'grid'); // off-list keeps current
  assert.deepEqual(TYPES.list.coerce('nope', {}, [1]), [1]);                              // non-array keeps current
});

test('bool / enum / number methods are pure value transforms', () => {
  assert.equal(TYPES.bool.methods.toggle(false), true);
  assert.equal(TYPES.enum.methods.cycle('grid', { values: ['grid', 'list', 'columns'] }), 'list');
  assert.equal(TYPES.number.methods.inc(10, {}, 5), 15);
  assert.equal(TYPES.number.methods.dec(10, {}), 9);
  assert.equal(TYPES.number.methods.clamp(999, { min: 0, max: 100 }), 100);
  assert.equal(TYPES.number.methods.round(3.14159, {}, 2), 3.14);
});

test('string methods', () => {
  assert.equal(TYPES.string.methods.toKebab('Hello World'), 'hello-world');
  assert.equal(TYPES.string.methods.toKebab('myCamelCase'), 'my-camel-case');
  assert.equal(TYPES.string.methods.toSlug('Café Déjà Vu'), 'cafe-deja-vu');   // accents stripped
  assert.equal(TYPES.string.methods.toUpper('hi'), 'HI');
});

test('list methods and reads', () => {
  assert.deepEqual(TYPES.list.methods.push([1, 2], {}, 3), [1, 2, 3]);
  assert.deepEqual(TYPES.list.methods.remove([1, 2, 3], {}, 2), [1, 3]);
  assert.deepEqual(TYPES.list.methods.toggle([1, 2], {}, 2), [1]);
  assert.deepEqual(TYPES.list.methods.toggle([1], {}, 2), [1, 2]);
  assert.equal(TYPES.list.reads.has([1, 2], {}, 2), true);
});
