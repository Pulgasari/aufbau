// @aufbau/utils/fp/predicates.js (8.97kb)

import { and, not, or } from './core.js';

//////////// 1. FACTORIES (internal) ////////////

// the constructor lookup happens once at module evaluation, not on every check
const instanceOf = (ctor) => ctor == null ? () => false : (value) => value instanceof ctor;
const matches    = (regex) => (value) => typeof value === 'string' && regex.test(value);
const typeOf     = (type)  => (value) => typeof value === type;

// undefined outside the browser (node, deno, ssr)
const origin = globalThis.location?.origin;

export const // :::::: EXPORTS ::::::::::::::::::::::::::::::::::::
  
//////////// 2. PRIMITIVES & TYPES ////////////

bigInt     = typeOf('bigint'),
boolean    = typeOf('boolean'),
defined    = (value) => value !== undefined,
func       = typeOf('function'),
null_      = (value) => value === null,
nullish    = (value) => value ==  null,
primitive  = (value) => value !== Object(value),
string     = typeOf('string'),
symbol     = typeOf('symbol'),
undefined_ = (value) => value === undefined,

//////////// 3. NUMBERS ////////////

// hot predicates are written out instead of composed, one callback per check adds up
even     = (value) => Number.isInteger(value) && value % 2 === 0,
finite   = Number.isFinite,
float    = (value) => typeof value === 'number' && !Number.isNaN(value) && !Number.isInteger(value),
integer  = Number.isInteger,
nan      = Number.isNaN,
negative = (value) => typeof value === 'number' && value < 0,
number   = (value) => typeof value === 'number' && !Number.isNaN(value),
odd      = (value) => Number.isInteger(value) && Math.abs(value % 2) === 1,
positive = (value) => typeof value === 'number' && value > 0,
zero     = (value) => value === 0,

numericString = (value) => typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)),
numeric       = (value) => number(value) || numericString(value),
year          = (value) => numeric(value) && /^\d{4}$/.test(String(value)) && +value >= 0 && +value <= 9999;

//////////// 4. OBJECTS & DATA STRUCTURES ////////////

export const 
array        = Array.isArray,
buffer       = (value) => typeof Buffer !== 'undefined' && Buffer.isBuffer(value),
date         = (value) => value instanceof Date && !Number.isNaN(value.getTime()),
error        = instanceOf(Error),
map          = instanceOf(globalThis.Map ?? null),
object       = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value),
plainObject  = (value) => value !== null && typeof value === 'object' && value.constructor === Object,
promise      = instanceOf(Promise),
realObject   = (value) => value?.constructor === Object,
regExp       = instanceOf(RegExp),
set          = instanceOf(globalThis.Set ?? null),
strictObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

export const 
asyncIterable = (value) => value != null && typeof value[Symbol.asyncIterator] === 'function',
iterable      = (value) => value != null && typeof value[Symbol.iterator]      === 'function';

//////////// 5. DOM & ENVIRONMENT (ssr-safe) ////////////

export const 
canvas       = instanceOf(globalThis.HTMLCanvasElement ?? null),
element      = instanceOf(globalThis.Element           ?? null),
fragment     = instanceOf(globalThis.DocumentFragment  ?? null),
node         = instanceOf(globalThis.Node              ?? null),
domNode      = node,
elementish   = or(element, fragment, instanceOf(globalThis.Document ?? null)),
realNodeList = instanceOf(globalThis.NodeList ?? null);

// indexed loop instead of [...value].every(node), spreading copies the whole list just to read it
export const nodeList = (value) => {
  if (!realNodeList(value) && !Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index++) if (!node(value[index])) return false;
  return true;
};

// without a location (ssr) nothing can be same-origin, so only absolute urls count as external
export const internalUrl = (value) => string(value) && origin !== undefined && value.startsWith(origin);
export const externalUrl = (value) => string(value) && (
  origin === undefined ? /^[a-z][a-z0-9+.-]*:\/\//i.test(value) : !value.startsWith(origin)
);

//////////// 6. EMPTINESS ////////////

export const blank       = (value) => value === null || value === undefined || value === '';
export const blankish    = (value) => !value && value !== 0 && value !== false;
export const emptyArray  = (value) => Array.isArray(value) && value.length === 0;
export const emptyMap    = (value) => map(value) && value.size === 0;
export const emptyObject = (value) => plainObject(value) && Object.keys(value).length === 0;
export const emptySet    = (value) => set(value) && value.size === 0;
export const emptyString = (value) => typeof value === 'string' && value.length === 0;

export const empty = (value) =>
  value === '' || (value != null && value.length === 0) || emptyMap(value) || emptySet(value) || emptyObject(value);

export const filled = (value) => !blank(value) && !empty(value) && !emptyObject(value);

//////////// 7. FORMATS & PARSING ////////////

export const alphaNumeric = matches(/^[a-z0-9]+$/i);
export const dateString   = (value) => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(value) || (!Number.isNaN(Date.parse(value)) && Number.isNaN(Number(value)));
export const email        = matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
export const hexColor     = matches(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
export const uuid         = matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

// surrounding whitespace is tolerated, the alternation covers paired and self-closing tags
export const html = (value) =>
  typeof value === 'string' && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(value.trim());

// the length guard rejects the empty string, which the regex alone accepts
export const base64 = (value) =>
  typeof value === 'string' && value.length > 0 && value.length % 4 === 0
  && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);

export const json = (value) => {
  if (typeof value !== 'string') return false;
  try { JSON.parse(value); return true; } catch { return false; }
};

export const url = (value) => {
  try { new URL(value); return true; } catch { return false; }
};

//////////// 8. STRING CASES ////////////

export const constantCase = matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/);
export const kebabCase    = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const lowerCase    = (value) => typeof value === 'string' && value === value.toLowerCase();
export const pascalCase   = matches(/^[A-Z][a-zA-Z0-9]*$/);
export const snakeCase    = matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);
export const upperCase    = (value) => typeof value === 'string' && value === value.toUpperCase();
export const camelCase    = and(matches(/^[a-z][a-zA-Z0-9]*$/), not(upperCase));

//////////// 9. LISTS ////////////

export const entriesList = (value) => Array.isArray(value) && value.every((item) => Array.isArray(item) && item.length === 2);
export const objectList  = (value) => Array.isArray(value) && value.every(object);
export const stringList  = (value) => Array.isArray(value) && value.every(string);

//////////// 10. DEPRECATED ALIASES (names from the first draft)

export const date2 = dateString;
export const falsy = blankish;
