// classes/Controller.js

import { CanonicalMap } from './../vendors.js';

import { defineTokens }                   from './../methods/defineTokens.js';
import { kebabProperty, serializeValue }  from './../methods/resolveDeclaration.js';
import { StyleSheet }                     from './StyleSheet.js';

// matches a bare css identifier, so value tokens are only substituted on exact
// whole-word hits — never inside a longer identifier or a hex color.
const WORD = /[A-Za-z_][\w-]*/g;

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

    this._aliases = new CanonicalMap(options.aliases ?? {}, ['kebab', 'camel']);
    this._tokens  = new Map(Object.entries(options.tokens ?? {}));
    this._vars    = { ...(options.vars ?? {}) };
    this._sheets  = new Map;

    this._aliasesProxy = this._registryProxy(this._aliases);
    this._tokensProxy  = this._registryProxy(this._tokens);
    this._varsProxy    = this._makeVarsProxy();
    this._sheetsProxy  = this._makeSheetsProxy();
  }

  // ── registries (get -> proxy, set -> merge, never replace the proxy) ──────

  get aliases ()    { return this._aliasesProxy; }
  set aliases (obj) { this._mergeInto(this._aliases, obj); }

  get tokens ()    { return this._tokensProxy; }
  set tokens (obj) { this._mergeInto(this._tokens, obj); }

  get vars ()    { return this._varsProxy; }
  set vars (obj) { Object.assign(this._vars, obj); }

  get sheets ()    { return this._sheetsProxy; }
  set sheets (obj) { for (const [key, value] of Object.entries(obj)) this._assignSheet(key, value); }

  // ── resolution (called by resolveDeclaration via the compiler) ────────────

  property (name) {
    return this._aliases.get(name) ?? kebabProperty(name);
  }

  value (raw) {
    if (typeof raw !== 'string') return serializeValue(raw);
    if (this._tokens.size === 0)  return raw;

    const whole = this._tokens.get(raw);
    if (whole !== undefined) return String(whole);

    return raw.replace(WORD, (word) => {
      const hit = this._tokens.get(word);
      return hit === undefined ? word : String(hit);
    });
  }

  // ── sheets ────────────────────────────────────────────────────────────────

  createSheet (options = {}) {
    return new StyleSheet(options.id, {
      ...options,
      controller : this,
      target     : options.target ?? this.target,
    });
  }

  adopt (target) {
    if (Object.keys(this._vars).length) this._varsSheet().adopt(target);
    for (const sheet of this._sheets.values()) sheet.adopt(target);
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

  // emits the collected vars as a :root custom-property block in the tokens layer.
  _varsSheet () {
    const { toCSS } = defineTokens(this._vars);
    const sheet = this._sheets.get('__vars__') ?? this.createSheet({ id: '__vars__', layer: 'tokens' });

    sheet.tree    = {};
    sheet.rawTail = toCSS(':root') + '\n';
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
        return (value !== null && typeof value === 'object')
          ? value
          : `var(${toVarName(key)}, ${value})`;
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
