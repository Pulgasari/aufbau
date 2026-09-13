// @aufbau/ass tests. run: node --test

import assert          from 'node:assert/strict';
import { test }        from 'node:test';
import { compile }     from '../index.js';

// collapses whitespace so assertions do not depend on emitted formatting
const norm = css => css.replace(/\s+/g, ' ').trim();
const has  = (css, part) => assert.ok(norm(css).includes(norm(part)), `expected to find:\n  ${part}\nin:\n  ${css}`);

test('@default resolves a name only on its declared property', () => {
  const css = compile(`
    @default gap, margin, padding {
      small : 0.5rem;
      big   : 2rem;
    }
    @default color { brand: #008800; }

    .example { color: brand; gap: small; }
  `);
  has(css, '.example {');
  has(css, 'color: #008800;');
  has(css, 'gap: 0.5rem;');
});

test('@default also resolves on longhands of a shorthand', () => {
  const css = compile(`@default padding { small: 0.5rem; } .x { padding-left: small; }`);
  has(css, 'padding-left: 0.5rem;');
});

test('@prop is property-led: distributes one property across target selectors', () => {
  const css = compile(`
    @prop font-size {
      header : 20px;
      main   : 16px;
      footer : 12px;
    }
  `);
  has(css, 'header { font-size: 20px; }');
  has(css, 'main { font-size: 16px; }');
  has(css, 'footer { font-size: 12px; }');
  assert.ok(!css.includes('@prop'), 'the @prop definition must not leak into output');
});

test('@prop nested in a selector combines targets with the parent', () => {
  const css = compile(`main { @prop font-size { h1: 20px; p: 16px; } }`);
  has(css, 'main h1 { font-size: 20px; }');
  has(css, 'main p { font-size: 16px; }');
});

test('@prop resolves its values through @default tokens', () => {
  const css = compile(`@default font-size { big: 20px; } @prop font-size { h1: big; }`);
  has(css, 'h1 { font-size: 20px; }');
});

test('@value expands a reversed declaration to each listed prop', () => {
  const css = compile(`
    .clean-button {
      @value #FFFF00 : background-color;
      @value red     : border-color color;
      @value unset   : margin padding;
    }
  `);
  has(css, 'background-color: #FFFF00;');
  has(css, 'border-color: red;');
  has(css, 'color: red;');
  has(css, 'margin: unset;');
  has(css, 'padding: unset;');
});

test('@mixin inlines declarations and flattens nested rules against the host', () => {
  const css = compile(`
    @mixin vert {
      display   : flex;
      flex-flow : column;
      > * { flex: 1 0 auto; }
    }
    body { use: .vert; }
  `);
  has(css, 'body {');
  has(css, 'display: flex;');
  has(css, 'flex-flow: column;');
  has(css, 'body > * {');
  has(css, 'flex: 1 0 auto;');
  assert.ok(!css.includes('@mixin'), 'the @mixin definition must not leak into output');
  assert.ok(!norm(css).includes('use:'), 'the use declaration must be consumed');
});

test('any single class rule can be used as a mixin and still emits itself', () => {
  const css = compile(`.vert { display: flex; } #app { use: .vert; }`);
  has(css, '.vert { display: flex; }');
  has(css, '#app { display: flex; }');
});

test('plain css passes through unchanged (superset)', () => {
  const css = compile(`.a { color: red; width: calc(100% - 2px); background: url(x.png); }`);
  has(css, 'color: red;');
  has(css, 'width: calc(100% - 2px);');
  has(css, 'background: url(x.png);');
});

test('comments and quoted delimiters do not break scanning', () => {
  const css = compile(`
    /* header */
    .a { content: "a; b: c"; color: red; /* trailing */ }
    // line comment
    .b { color: red; }
  `);
  has(css, `content: "a; b: c";`);
  has(css, '.b { color: red; }');
});

test('& in a nested selector is substituted with the parent', () => {
  const css = compile(`.card { color: red; &:hover { color: blue; } }`);
  has(css, '.card { color: red; }');
  has(css, '.card:hover { color: blue; }');
});
