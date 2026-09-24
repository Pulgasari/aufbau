// @aufbau/ass/tag.js
// ass`` is to css what htx's html`` is to markup: a tagged template that takes
// ass source, compiles it to plain css and hands back something every css sink
// accepts.
//
//   const card = ass`
//     @default padding { small: 0.5rem; }
//     .card { padding: small; color: ${accent}; }
//   `;
//
//   card.css                  compiled css string (also what String(card) gives)
//   card.sheet                a constructed CSSStyleSheet, shared per css text
//   card.adopt(root)          adopts the sheet into a document or shadow root
//   static styles = card      works in every aufbau element, it stringifies
//
// interpolation:
//   string, number            inserted as they are (like any css-in-js tag)
//   ass`` result              inserted as SOURCE, not as compiled css, so tokens
//                             and mixins of the inner block reach the outer one
//   array                     each item, one per line
//   plain object              declarations: { paddingTop: '1rem' } -> padding-top: 1rem;
//                             a nested object becomes a nested rule
//   null, undefined, boolean  nothing, which makes ${dark && ass`…`} work
//
// like html.define() in htx, an instance carries a registry: tokens and mixins
// defined once are available in every template of that instance.
//
//   ass.define('gap, margin, padding', { small: '0.5rem', big: '2rem' });
//   ass.define({ color: { brand: '#080' } });
//   ass.mixin('stack', ass`display: flex; flex-direction: column;`);
//
//   ass`.list { gap: small; use: .stack; }`
//
// zero dependencies. compiling needs no dom, only .sheet and .adopt() do.

import { compile } from './index.js';

const CACHE_LIMIT = 500;

const isPlainObject = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const kebab         = key => key.startsWith('--') ? key : key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);

// compiled css per source text, and one constructed sheet per css text. both
// are shared by every instance, compile() is pure
const compiled = new Map;
const sheets   = new Map;

const remember = (map, key, make) => {
  if (map.has(key)) return map.get(key);
  if (map.size >= CACHE_LIMIT) map.delete(map.keys().next().value);
  const value = make();
  map.set(key, value);
  return value;
};

// :::::: RESULT ::::::::::::::::::::::::::::::::::::::::::::::::

class AssResult {
  constructor (source, prelude) {
    this.source   = source;
    this._prelude = prelude;
  }

  get css () {
    const code = this._prelude() + this.source;
    return remember(compiled, code, () => compile(code));
  }

  get sheet () {
    if (typeof CSSStyleSheet === 'undefined') return null;
    const css = this.css;
    return remember(sheets, css, () => {
      const sheet = new CSSStyleSheet;
      sheet.replaceSync(css);
      return sheet;
    });
  }

  /**
   * adopts the sheet into a document, a shadow root, or the tree an element
   * sits in. idempotent. returns a function that removes it again.
   */
  adopt (target = document) {
    const root  = target.adoptedStyleSheets ? target : (target.shadowRoot ?? target.getRootNode?.() ?? document);
    const sheet = this.sheet;
    if (!sheet || !root.adoptedStyleSheets) return () => {};

    if (!root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    return () => { root.adoptedStyleSheets = root.adoptedStyleSheets.filter(item => item !== sheet); };
  }

  toString () { return this.css; }
}

const isResult = value => value instanceof AssResult;

// :::::: INTERPOLATION :::::::::::::::::::::::::::::::::::::::::

function declarations (object) {
  return Object.entries(object).map(([key, value]) =>
      isPlainObject(value)            ? `${key} { ${declarations(value)} }`
    : value == null || value === false ? ''
    :                                    `${kebab(key)}: ${value};`
  ).filter(Boolean).join(' ');
}

function interpolate (value) {
  if (value == null || typeof value === 'boolean') return '';
  if (isResult(value))       return value.source;
  if (Array.isArray(value))  return value.map(interpolate).join('\n');
  if (isPlainObject(value))  return declarations(value);
  return String(value);
}

// :::::: INSTANCE ::::::::::::::::::::::::::::::::::::::::::::::

/**
 * a tag with a registry of its own.
 *   createASS({ tokens: { 'gap, padding': { small: '0.5rem' } }, mixins: { stack: '…' } })
 */
export function createASS ({ mixins = {}, tokens = {} } = {}) {
  const registry = { mixins: new Map, tokens: new Map };
  let prelude = null;

  // the registry as ass source, rebuilt only after a define() or mixin()
  const preludeOf = () => prelude ??= [
    ...[...registry.tokens].map(([props, values]) => `@default ${props} { ${declarations(values)} }`),
    ...[...registry.mixins].map(([name, body]) => `@mixin ${name} { ${interpolate(body)} }`),
  ].join('\n') + '\n';

  function ass (strings, ...values) {
    const source = strings.reduce((out, part, index) => out + part + (index < values.length ? interpolate(values[index]) : ''), '');
    return new AssResult(source, preludeOf);
  }

  /** define('gap, padding', { small: '0.5rem' }) or define({ 'gap, padding': { … }, color: { … } }) */
  ass.define = (props, values) => {
    const entries = typeof props === 'string' ? [[props, values]] : Object.entries(props);
    for (const [key, map] of entries) registry.tokens.set(key, { ...registry.tokens.get(key), ...map });
    prelude = null;
    return ass;
  };

  /** mixin('stack', ass`…` | 'display: flex;') or mixin({ stack: …, center: … }). used as `use: .stack` */
  ass.mixin = (name, body) => {
    const entries = typeof name === 'string' ? [[name, body]] : Object.entries(name);
    for (const [key, value] of entries) registry.mixins.set(key.replace(/^\./, ''), value);
    prelude = null;
    return ass;
  };

  ass.registry = registry;

  /** compiles without the tag syntax, e.g. for source read from a file */
  ass.compile = (source) => new AssResult(String(source), preludeOf).css;

  ass.define(tokens);
  ass.mixin(mixins);

  return ass;
}

/** the shared instance */
export const ass = createASS();

export { AssResult, isResult };
export default ass;
