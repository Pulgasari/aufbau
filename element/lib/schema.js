import { CanonicalMap }                 from '@pulgasari/canonicalmap';
import { isArray, isFn, isPlainObject, toCamelCase, toKebabCase } from './shared.js';

const TYPES  = { boolean: Boolean, number: Number, string: String };
const typeOf = value => isArray(value) ? Array : isPlainObject(value) ? Object : TYPES[typeof value] ?? String;

// values no attribute can carry: such an entry is a property, stored on the instance
const RICH = new Set([Array, Function, Object]);

const cache = new WeakMap;

// prop: a stored value without attribute, state: the same without a public accessor
function entryOf (key, spec) {
  const entry = { name: toCamelCase(key), attribute: toKebabCase(key), type: String, fallback: undefined, values: null, fn: null, var: null, prop: false, state: false, hasChanged: null };

  if (isFn(spec)) entry.type = spec;
  else if (isPlainObject(spec)) {
    entry.type       = spec.type ?? typeOf(spec.default);
    entry.fallback   = spec.default;
    entry.values     = isArray (spec.values)     ? spec.values     : null;
    entry.fn         = isFn    (spec.fn)         ? spec.fn         : null;
    entry.var        = spec.var === true ? `--${entry.attribute}` : (spec.var ?? null);
    entry.prop       = spec.prop  === true;
    entry.state      = spec.state === true;
    entry.hasChanged = isFn    (spec.hasChanged) ? spec.hasChanged : null;
  }
  else if (spec != null) {
    entry.type     = typeOf(spec);
    entry.fallback = spec;
  }

  if (RICH.has(entry.type)) entry.prop = true;
  if (entry.state) entry.prop = false;

  return Object.freeze(entry);
}

// an entry that lives in an attribute, as opposed to a stored prop or state
export const isAttribute = entry => !entry.prop && !entry.state;

// a name outside the schema: a string attribute, nothing more
export const looseEntry = key => entryOf(key);

function attrOwners (Class) {
  const owners = [];
  for (let c = Class; isFn(c); c = Object.getPrototypeOf(c)) {
    if (Object.hasOwn(c, 'attr') && c.attr) owners.unshift(c);
  }
  return owners;
}

// attr: { name: spec } or a list of names
export function schemaOf (Class) {
  if (cache.has(Class)) return cache.get(Class);

  const schema = new CanonicalMap(null, ['kebab', 'camel', 'snake']);
  for (const { attr } of attrOwners(Class)) {
    const specs = isArray(attr) ? attr.map(name => [name, String]) : Object.entries(attr);
    for (const [key, spec] of specs) schema.set(key, entryOf(key, spec));
  }

  cache.set(Class, schema);
  return schema;
}
