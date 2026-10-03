import { CanonicalMap }                 from '@pulgasari/canonicalmap';
import { isArray, isFn, isPlainObject } from '@pulgasari/is';
import { toCamelCase, toKebabCase }     from '@pulgasari/str';

// the one place where an attribute's names are worked out. an entry knows them all:
// name (itemSize) for js, attribute (item-size) for the dom, var (--item-size) for css.
// the schema is a CanonicalMap, so itemSize, item-size and item_size find the same entry

const TYPES  = { boolean: Boolean, number: Number, string: String };
const typeOf = value => TYPES[typeof value] ?? String;

const cache = new WeakMap;

function entryOf (key, spec) {
  const entry = { name: toCamelCase(key), attribute: toKebabCase(key), type: String, fallback: undefined, values: null, fn: null, var: null };

  if (isFn(spec)) entry.type = spec;
  else if (isPlainObject(spec)) {
    entry.type     = spec.type ?? typeOf(spec.default);
    entry.fallback = spec.default;
    entry.values   = isArray(spec.values) ? spec.values : null;
    entry.fn       = isFn(spec.fn) ? spec.fn : null;
    entry.var      = spec.var === true ? `--${entry.attribute}` : (spec.var ?? null);
  }
  else if (spec != null) {
    entry.type     = typeOf(spec);
    entry.fallback = spec;
  }

  return Object.freeze(entry);
}

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
