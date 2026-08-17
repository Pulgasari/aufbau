// classes/Controller.js

import { CanonicalMap } from './../vendors.js';

import { kebabProperty, serializeValue }  from './../methods/resolveDeclaration.js';
import { shade }                          from './../shades.js';
import { StyleSheet }                     from './StyleSheet.js';

// matches a bare css identifier, so value tokens are only substituted on exact
// whole-word hits — never inside a longer identifier or a hex color.
const WORD = /[A-Za-z_][\w-]*/g;

// built-in property aliases and named easings (the motion sugar).
const BUILTIN_ALIAS = { motion: 'transition' };
const EASING = {
  smooth : 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy : 'cubic-bezier(0.4, 0, 0, 1)',
  spring : 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// proxy keys that must not be treated as registry entries: coercion hooks and
// thenable probes (so `await controller.x` does not hang on a fake thenable).
const isReserved = (key) =>
  typeof key === 'symbol' || key === 'then' || key === 'catch' || key === 'toJSON';

// derives a custom-property name the same way defineTokens does.
const toVarName = (key) => '--' + key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

/**
 * Central authoring context: property-name aliases, literal value tokens,
 * custom-property vars, and a named stylesheet registry. Resolution methods
 * (property/value) are consumed by the compiler through sheet.controller.
 */
export class Controller {
  constructor (options = {}) {
    this.target = options.target ?? null;

    this._aliases     = new CanonicalMap(options.aliases ?? {}, ['kebab', 'camel']);
    this._breakpoints = new Map(Object.entries(options.breakpoints ?? {}));
    this._tokens      = new Map(Object.entries(options.tokens ?? {}));
    this._traits      = new Map(Object.entries(options.traits ?? {}));
    this._vars        = { ...(options.vars ?? {}) };
    this._sheets      = new Map;
    this._layerOrder  = options.layers ? [...options.layers] : null;
    this._reducedMotion = options.reducedMotion ?? false;

    this._aliasesProxy     = this._registryProxy(this._aliases);
    this._breakpointsProxy = this._registryProxy(this._breakpoints);
    this._tokensProxy      = this._registryProxy(this._tokens);
    this._traitsProxy      = this._registryProxy(this._traits);
    this._varsProxy        = this._makeVarsProxy();
    this._sheetsProxy      = this._makeSheetsProxy();
  }

  // ── registries (get -> proxy, set -> merge, never replace the proxy) ──────

  get aliases ()    { return this._aliasesProxy; }
  set aliases (obj) { this._mergeInto(this._aliases, obj); }

  get tokens ()    { return this._tokensProxy; }
  set tokens (obj) { this._mergeInto(this._tokens, obj); }

  // named breakpoints for the `@<name>` at-rule shorthand in style objects.
  get breakpoints ()    { return this._breakpointsProxy; }
  set breakpoints (obj) { this._mergeInto(this._breakpoints, obj); }

  // reusable declaration sets. read one back for spread (`...ass.traits.card`),
  // or reference it by name via the `use` key inside a style object.
  get traits ()    { return this._traitsProxy; }
  set traits (obj) { this._mergeInto(this._traits, obj); }

  get vars ()    { return this._varsProxy; }
  set vars (obj) { Object.assign(this._vars, obj); }

  get sheets ()    { return this._sheetsProxy; }
  set sheets (obj) { for (const [key, value] of Object.entries(obj)) this._assignSheet(key, value); }

  // declares cascade layer order, e.g. controller.layers = ['tokens', 'base', …]
  // -> a single `@layer tokens, base, …;` statement, adopted before everything.
  get layers ()     { return this._layerOrder ? [...this._layerOrder] : []; }
  set layers (list) { this._layerOrder = [...list]; }

  // opt-in global prefers-reduced-motion reset, emitted once on adopt.
  get reducedMotion ()   { return this._reducedMotion; }
  set reducedMotion (on) { this._reducedMotion = !!on; }

  // ── resolution (called by resolveDeclaration via the compiler) ────────────

  property (name) {
    return this._aliases.get(name) ?? BUILTIN_ALIAS[name] ?? kebabProperty(name);
  }

  value (raw) {
    if (typeof raw !== 'string') return serializeValue(raw);

    const whole = this._tokens.get(raw);
    if (whole !== undefined) return String(whole);

    return raw.replace(WORD, (word) => this._resolveWord(word));
  }

  // resolves a trait name to its declaration set (used by the `use` key).
  resolveTrait (name) {
    return this._traits.get(name) ?? {};
  }

  // resolves a breakpoint name to its value (used by the `@<name>` at-rule key).
  breakpoint (name) {
    return this._breakpoints.get(name);
  }

  // resolves a single value word: a literal token, or a shade suffix on a known
  // token/var (brand-a20 / brand-d15 / brand-l20 -> color-mix), else the word itself.
  _resolveWord (word) {
    const token = this._tokens.get(word);
    if (token !== undefined) return String(token);

    if (word in EASING) return EASING[word];

    const match = word.match(/^(.+)-(a|d|l)(\d+)$/);
    if (match) {
      const base = this._resolveBase(match[1]);
      if (base !== undefined) {
        const amount = parseInt(match[3], 10);
        const options = match[2] === 'a' ? { alpha: amount / 100 }
                      : match[2] === 'd' ? { darken: amount }
                      :                    { lighten: amount };
        return shade(base, options);
      }
    }

    return word;
  }

  // a shade base may be a literal token value or a custom-property (var(--x)).
  _resolveBase (name) {
    const token = this._tokens.get(name);
    if (token !== undefined)  return String(token);
    if (name in this._vars)   return `var(${toVarName(name)})`;
    return undefined;
  }

  // ── sheets ────────────────────────────────────────────────────────────────

  createSheet (options = {}) {
    return new StyleSheet(options.id, {
      ...options,
      controller : this,
      target     : options.target ?? this.target,
    });
  }

  // adopts in a fixed order: the layer declaration first, then the :root vars
  // (tokens layer), then every user sheet.
  adopt (target) {
    if (this._layerOrder?.length)       this._layersSheet().adopt(target);
    if (Object.keys(this._vars).length) this._varsSheet().adopt(target);
    if (this._reducedMotion)            this._motionSheet().adopt(target);

    for (const [id, sheet] of this._sheets) {
      if (id === '__layers__' || id === '__vars__' || id === '__motion__') continue;
      sheet.adopt(target);
    }
    return this;
  }

  // ── internals ─────────────────────────────────────────────────────────────

  _mergeInto (backing, obj) {
    for (const [key, value] of Object.entries(obj)) backing.set(key, value);
    return backing;
  }

  // registers a sheet, or deep-merges a plain object into the sheet at that key,
  // creating an empty one when none exists yet.
  _assignSheet (key, value) {
    if (value instanceof StyleSheet) {
      value.id   ??= key;
      value.name ??= key;
      this._sheets.set(key, value);
      return value;
    }

    let sheet = this._sheets.get(key);
    if (!sheet) this._sheets.set(key, sheet = this.createSheet({ id: key }));
    sheet.define(value);
    return sheet;
  }

  // emits the bare `@layer a, b, c;` order statement (no domina primitive exists).
  _layersSheet () {
    const sheet = this._sheets.get('__layers__') ?? this.createSheet({ id: '__layers__' });

    sheet.tree    = {};
    sheet.rawTail = `@layer ${this._layerOrder.join(', ')};\n`;
    sheet.dirty   = true;
    this._sheets.set('__layers__', sheet);
    return sheet;
  }

  // emits the standard global prefers-reduced-motion reset.
  _motionSheet () {
    const sheet = this._sheets.get('__motion__') ?? this.createSheet({ id: '__motion__' });

    sheet.tree    = {};
    sheet.rawTail =
      '@media (prefers-reduced-motion: reduce) {\n' +
      '  *, ::before, ::after {\n' +
      '    animation-duration: 0.01ms !important;\n' +
      '    animation-iteration-count: 1 !important;\n' +
      '    transition-duration: 0.01ms !important;\n' +
      '    scroll-behavior: auto !important;\n' +
      '  }\n}\n';
    sheet.dirty   = true;
    this._sheets.set('__motion__', sheet);
    return sheet;
  }

  // emits the collected vars as a :root custom-property block in the tokens layer.
  // a two-element array is a [light, dark] pair -> light-dark(), which also turns
  // on color-scheme so the browser honors it.
  _varsSheet () {
    const sheet = this._sheets.get('__vars__') ?? this.createSheet({ id: '__vars__', layer: 'tokens' });
    const lines = [];
    let lightDark = false;

    for (const [key, value] of Object.entries(this._vars)) {
      if (Array.isArray(value) && value.length === 2) {
        lines.push(`  ${toVarName(key)}: light-dark(${value[0]}, ${value[1]});`);
        lightDark = true;
      } else {
        lines.push(`  ${toVarName(key)}: ${value};`);
      }
    }
    if (lightDark) lines.unshift('  color-scheme: light dark;');

    sheet.tree    = {};
    sheet.rawTail = `:root {\n${lines.join('\n')}\n}\n`;
    sheet.dirty   = true;
    this._sheets.set('__vars__', sheet);
    return sheet;
  }

  // flat registry facade over a Map/CanonicalMap: get/set/delete/has/keys.
  _registryProxy (backing) {
    return new Proxy(Object.create(null), {
      get (_, key)               { return isReserved(key) ? undefined : backing.get(key); },
      set (_, key, value)        { if (typeof key !== 'string') return false; backing.set(key, value); return true; },
      deleteProperty (_, key)    { backing.delete(key); return true; },
      has (_, key)               { return typeof key === 'string' && backing.has(key); },
      ownKeys ()                 { return [...backing.keys()]; },
      getOwnPropertyDescriptor (_, key) {
        return backing.has(key) ? { enumerable: true, configurable: true } : undefined;
      },
    });
  }

  // vars facade: reading a primitive var returns its var(--name, fallback) ref.
  _makeVarsProxy () {
    const vars = this._vars;
    return new Proxy(Object.create(null), {
      get (_, key) {
        if (isReserved(key) || !(key in vars)) return undefined;
        const value = vars[key];
        if (Array.isArray(value))                        return `var(${toVarName(key)})`;
        if (value !== null && typeof value === 'object') return value;
        return `var(${toVarName(key)}, ${value})`;
      },
      set (_, key, value)     { if (typeof key !== 'string') return false; vars[key] = value; return true; },
      deleteProperty (_, key) { delete vars[key]; return true; },
      has (_, key)            { return typeof key === 'string' && key in vars; },
      ownKeys ()              { return Object.keys(vars); },
      getOwnPropertyDescriptor (_, key) {
        return key in vars ? { enumerable: true, configurable: true } : undefined;
      },
    });
  }

  // sheets facade: get -> the sheet; set -> register a sheet or deep-merge rules.
  _makeSheetsProxy () {
    const self = this;
    return new Proxy(Object.create(null), {
      get (_, key)            { return isReserved(key) ? undefined : self._sheets.get(key); },
      set (_, key, value)     { if (typeof key !== 'string') return false; self._assignSheet(key, value); return true; },
      deleteProperty (_, key) { self._sheets.delete(key); return true; },
      has (_, key)            { return typeof key === 'string' && self._sheets.has(key); },
      ownKeys ()              { return [...self._sheets.keys()]; },
      getOwnPropertyDescriptor (_, key) {
        return self._sheets.has(key) ? { enumerable: true, configurable: true } : undefined;
      },
    });
  }
}

export default Controller;
