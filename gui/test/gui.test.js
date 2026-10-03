// @aufbau/gui tests. run: node --test
// only the dependency-free layers are covered here (control mapping, html
// output, readback). the dom renderer needs a browser dom and is exercised in
// the app, not in node.

import assert         from 'node:assert/strict';
import { test }       from 'node:test';
import { toControl }  from '../control.js';
import { fieldHTML, renderHTML } from '../html.js';
import { readValues } from '../read.js';

test('toControl maps types to the right aufbau control', () => {
  assert.equal(toControl('a', { type: 'boolean' }).tag, 'input-bool');
  assert.equal(toControl('a', { type: 'number'  }).tag, 'input-number');
  assert.equal(toControl('a', { type: 'color'   }).tag, 'input-color');
  assert.equal(toControl('a', { type: 'wat'     }).tag, 'input-value'); // unknown -> input fallback
});

test('toControl makes a picker when values are present and keeps the options', () => {
  const c = toControl('mode', { values: ['a', 'b'] });
  assert.equal(c.tag, 'input-value');
  assert.deepEqual(c.options, ['a', 'b']);
  assert.equal(c.attrs.name, 'mode');
});

test('toControl prunes null attrs and strips the unit off a duration step', () => {
  const toggle = toControl('a', { type: 'boolean' }); // value falsy -> value null -> pruned
  assert.ok(!('value' in toggle.attrs));

  const dur = toControl('speed', { type: 'duration', step: '0.5s' });
  assert.equal(dur.attrs.step, 0.5);
  assert.equal(dur.tag, 'input-duration');
});

test('toControl fills angle defaults', () => {
  const a = toControl('rot', { type: 'angle' });
  assert.deepEqual([a.attrs.min, a.attrs.max, a.attrs.step, a.attrs.unit], [0, 360, 1, 'deg']);
});

test('fieldHTML wraps a labelled control and escapes text', () => {
  const html = fieldHTML('title', { type: 'text', label: 'A < B' }, 'x');
  assert.match(html, /<label class="aufbau-field">/);
  assert.match(html, /<span class="aufbau-field-label">A &lt; B<\/span>/);
  assert.match(html, /<input-value name="title"/);
});

test('fieldHTML renders picker options', () => {
  const html = fieldHTML('mode', { values: [['a', 'Label A'], 'b'] });
  assert.match(html, /<input-value name="mode"/);
  assert.match(html, /<input-option value="a">Label A<\/input-option>/);
  assert.match(html, /<input-option value="b">b<\/input-option>/);
});

test('renderHTML wraps the whole spec, defaulting to <div>', () => {
  const html = renderHTML({ on: { type: 'boolean', label: 'On' }, n: { type: 'number' } });
  assert.ok(html.startsWith('<div>') && html.endsWith('</div>'));
  assert.match(html, /<input-bool name="on"/);
  assert.match(html, /<input-number name="n"/);
});

test('renderHTML can skip the wrapper', () => {
  const html = renderHTML({ n: { type: 'number' } }, { wrap: false });
  assert.ok(!html.startsWith('<div>'));
  assert.match(html, /^<label/);
});

test('readValues coerces each control back to a typed value', () => {
  const spec = { flag: { type: 'boolean' }, count: { type: 'integer' }, ratio: { type: 'number' }, speed: { type: 'duration' }, name: { type: 'text' } };
  const elements = {
    flag  : { checked: true },
    count : { value: '3.7' },
    ratio : { value: '0.5' },
    speed : { value: '2s' },
    name  : { value: 'hi' },
  };
  const container = { querySelector: sel => elements[sel.match(/\[name="(.+)"\]/)[1]] ?? null };

  assert.deepEqual(readValues(container, spec), {
    flag  : true,
    count : 4,      // rounded
    ratio : 0.5,
    speed : '2s',   // keeps its unit
    name  : 'hi',
  });
});

test('an array entry is a section: key as legend, records merged, values flat', () => {
  const spec = {
    title      : { type: 'text' },
    appearance : [{ palette: { values: ['oled', 'zombie'] } }, { density: { values: ['compact', 'touch'] } }],
  };

  const markup = renderHTML(spec, { values: { density: 'touch' }, wrap: false });
  assert.match(markup, /<fieldset class="aufbau-section" name="appearance"><legend>appearance<\/legend>/);
  assert.match(markup, /name="palette"/);
  assert.match(markup, /name="density" value="touch"/);

  const controls = {
    '[name="title"]:not(fieldset)'   : { value: 'x' },
    '[name="palette"]:not(fieldset)' : { value: 'oled' },
    '[name="density"]:not(fieldset)' : { value: 'touch' },
  };
  const container = { querySelector: selector => controls[selector] ?? null };
  assert.deepEqual(readValues(container, spec), { title: 'x', palette: 'oled', density: 'touch' });
});

test('sections nest', () => {
  const spec   = { outer: [{ inner: [{ deep: { type: 'text' } }] }] };
  const markup = renderHTML(spec, { wrap: false });
  assert.match(markup, /name="outer".*name="inner".*name="deep"/);
});

test('readValues nests the values by section on request', () => {
  const spec = {
    title      : { type: 'text' },
    appearance : [{ palette: { values: ['oled'] } }, { layout: [{ density: { values: ['touch'] } }] }],
  };
  const controls = {
    '[name="title"]:not(fieldset)'   : { value: 'x' },
    '[name="palette"]:not(fieldset)' : { value: 'oled' },
    '[name="density"]:not(fieldset)' : { value: 'touch' },
  };
  const container = { querySelector: selector => controls[selector] ?? null };

  assert.deepEqual(readValues(container, spec, { nested: true }), { title: 'x', appearance: { palette: 'oled', layout: { density: 'touch' } } });
  assert.deepEqual(readValues(container, spec), { title: 'x', palette: 'oled', density: 'touch' });
});

test('section fields take their value from a nested values object too', () => {
  const spec   = { appearance: [{ density: { values: ['compact', 'touch'] } }] };
  const markup = renderHTML(spec, { values: { appearance: { density: 'touch' } }, wrap: false });
  assert.match(markup, /name="density" value="touch"/);
});
