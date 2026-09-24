// @aufbau/ass tag tests. run: node --test

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ass, createASS } from '../index.js';

const norm = css => css.replace(/\s+/g, ' ').trim();
const has  = (css, part) => assert.ok(norm(css).includes(norm(part)), `expected to find:\n  ${part}\nin:\n  ${css}`);

test('compiles the template, values are inserted as they are', () => {
  const size = 4;
  const css  = ass`.box { padding: ${size}px; color: ${'red'}; }`.css;
  has(css, 'padding: 4px;');
  has(css, 'color: red;');
});

test('stringifies to the compiled css', () => {
  has(String(ass`.a { color: blue; }`), '.a { color: blue; }');
  has(`${ass`.b { color: green; }`}`, '.b { color: green; }');
});

test('a nested result is inserted as source, its tokens reach the outer block', () => {
  const tokens = ass`@default padding { small: 0.5rem; }`;
  const css    = ass`${tokens} .card { padding: small; }`.css;
  has(css, '.card { padding: 0.5rem; }');
  assert.ok(!css.includes('@default'));
});

test('falsy and boolean values render nothing', () => {
  const dark = false;
  const css  = ass`.a { color: red; } ${dark && ass`.a { color: white; }`} ${null}`.css;
  assert.ok(!css.includes('white'));
  assert.ok(!css.includes('false'));
});

test('arrays and plain objects', () => {
  has(ass`${['.a { color: red; }', '.b { color: blue; }']}`.css, '.b { color: blue; }');
  has(ass`.c { ${{ paddingTop: '1rem', '--gap': '2px' }} }`.css, 'padding-top: 1rem;');
  has(ass`.c { ${{ '--gap': '2px' }} }`.css, '--gap: 2px;');
});

test('define() tokens are available in every template of the instance', () => {
  const local = createASS();
  local.define('gap, padding', { small: '0.5rem' });
  local.define({ color: { brand: '#080' } });
  const css = local`.x { gap: small; padding-left: small; color: brand; }`.css;
  has(css, 'gap: 0.5rem;');
  has(css, 'padding-left: 0.5rem;');
  has(css, 'color: #080;');
});

test('mixin() blocks are usable with use:', () => {
  const local = createASS({ mixins: { stack: 'display: flex; flex-direction: column;' } });
  const css   = local`.list { use: .stack; gap: 1rem; }`.css;
  has(css, 'display: flex;');
  has(css, 'flex-direction: column;');
});

test('instances do not share their registry', () => {
  const one = createASS({ tokens: { color: { brand: 'red' } } });
  const two = createASS();
  has(one`.a { color: brand; }`.css, 'color: red;');
  has(two`.a { color: brand; }`.css, 'color: brand;');
});

test('a define() after a template was compiled applies to the next compile', () => {
  const local = createASS();
  const block = local`.a { color: brand; }`;
  has(block.css, 'color: brand;');
  local.define('color', { brand: 'teal' });
  has(block.css, 'color: teal;');
});
