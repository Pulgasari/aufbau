import { toArray }                      from '@pulgasari/coerce';
import { isArray, isFn, isPlainObject } from '@pulgasari/is';
import { toKebabCase }                  from '@pulgasari/str';

// true stays true, nothing is null, anything else is converted
function optional (value, convert) {
  if (value === true) return true;
  if (!value) return null;
  return convert(value);
}

const cache = new WeakMap;

export const BASE = Object.freeze({ type: String, fallback: undefined, values: null, fn: null, config: null, var: null });

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
    values   : isArray (entry.values) ? entry.values : null,
    fn       : isFn    (entry.fn)     ? entry.fn     : null,
    config   : optional(entry.config, toArray),
    var      : optional(entry.var, String),
  };

  // shorthand, bare default value: `volume: 50`
  if (entry != null) return { ...BASE, type: typeOf(entry), fallback: entry };

  return { ...BASE };
};

const attrOwners = (Class) => {
  const owners = [];
  for (let c = Class; isFn(c); c = Object.getPrototypeOf(c)) {
    if (Object.hasOwn(c, 'attr') && c.attr) owners.unshift(c);
  }
  return owners;
};

const entriesOf = (attr) =>
    isArray       (attr) ? attr.map(name => [name, String])
  : isPlainObject (attr) ? Object.entries(attr)
  : [];

export const schemaOf = (Class) => {
  const hit = cache.get(Class); if (hit) return hit;

  const parsed = {};
  for (const owner of attrOwners(Class)) {
    for (const [name, entry] of entriesOf(owner.attr)) {
      parsed[toKebabCase(name)] = parseSchemaEntry(entry);
    }
  }

  cache.set(Class, parsed);
  return parsed;
};
