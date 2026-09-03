// @aufbau/elements/core/schema.js

import { isArray, isFn, isPlainObject } from '@pulgasari/is';
import { toArray }     from '@pulgasari/coerce';
import { toKebabCase } from '@pulgasari/str';

const cache = new WeakMap;

// every entry normalizes to this shape, so consumers never have to null-check a key
export const BASE = Object.freeze({ type: String, fallback: undefined, values: null, fn: null, config: null, var: null });

// infers the type constructor from a default value when `type` is omitted
const TYPES  = { number: Number, boolean: Boolean, string: String };
const typeOf = (value) => TYPES[typeof value] ?? String;

export const parseSchemaEntry = (entry) => {

  // shorthand, bare constructor: `src: String`
  if (isFn(entry)) return { ...BASE, type: entry };

  // full form: `{ type, default, values, fn, config }`
  if (isPlainObject(entry)) return {
    ...BASE,
    type     : entry.type ?? typeOf(entry.default),
    fallback : entry.default,
    values   : isArray(entry.values) ? entry.values : null,
    fn       : isFn(entry.fn) ? entry.fn : null,
    // true -> auto namespaced key, string|string[] -> explicit keys
    config   : entry.config === true ? true : (entry.config ? toArray(entry.config) : null),
    // true -> var named after the attribute, string -> explicit var name
    var      : entry.var === true ? true : (entry.var ? String(entry.var) : null),
  };

  // shorthand, bare default value: `volume: 50`
  if (entry != null) return { ...BASE, type: typeOf(entry), fallback: entry };

  return { ...BASE };
};

/**
 * collects the classes in the prototype chain that declare their OWN `static
 * attr`, base class first. a subclass therefore EXTENDS the base schema instead
 * of shadowing it, which is what the shared control base relies on.
 */
const attrOwners = (Class) => {
  const owners = [];
  for (let c = Class; isFn(c); c = Object.getPrototypeOf(c)) {
    if (Object.hasOwn(c, 'attr') && c.attr) owners.unshift(c);
  }
  return owners;
};

// both the array shorthand (`['src', 'alt']`) and the object form normalize to entries
const entriesOf = (attr) =>
    isArray(attr)       ? attr.map(name => [name, String])
  : isPlainObject(attr) ? Object.entries(attr)
  : [];

/**
 * parsed schema for a class, keyed by kebab-case attribute name.
 * parsing happens once per class, the weakmap keeps subclasses separate
 * and dies with the class itself.
 * @param {Function} Class
 * @returns {Record<string, typeof BASE>}
 */
export const schemaOf = (Class) => {
  const hit = cache.get(Class); if (hit) return hit;

  // later owners win, so a subclass can redeclare a single inherited attribute
  const parsed = {};
  for (const owner of attrOwners(Class)) {
    for (const [name, entry] of entriesOf(owner.attr)) {
      parsed[toKebabCase(name)] = parseSchemaEntry(entry);
    }
  }

  cache.set(Class, parsed);
  return parsed;
};
