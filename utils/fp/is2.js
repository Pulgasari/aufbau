// ============================================================================
// 1. COMBINATORS & CORE HELPERS
// ============================================================================

// Type and Instance Check Factories
const typeOf = type => v => typeof v === type;
const instanceOf = ctor => v => typeof ctor !== 'undefined' && ctor !== null && v instanceof ctor;
const matches = re => v => typeof v === 'string' && re.test(v);

// Logic Combinators
export const not = fn => (...args) => !fn(...args);
export const and = (...fns) => v => fns.every(fn => (typeof fn === 'function' ? fn(v) : fn));
export const or  = (...fns) => v => fns.some(fn => (typeof fn === 'function' ? fn(v) : fn));

// Pattern Matcher (R.cond / switch-case replacement)
const testRule = (rule, val) => {
  if (typeof rule === 'function') return rule(val);
  if (typeof rule === 'boolean') return rule;
  if (Array.isArray(rule)) return rule.every(r => testRule(r, val));
  return false;
};

export const match = (rules, fallback = v => v) => (val) => {
  for (const [predicate, handler] of rules) {
    if (testRule(predicate, val)) {
      return typeof handler === 'function' ? handler(val) : handler;
    }
  }
  return typeof fallback === 'function' ? fallback(val) : fallback;
};

// ============================================================================
// 2. BASE PREDICATES (Clean names without 'is')
// ============================================================================

// Primitives & Types
export const string      = typeOf('string');
export const bigInt      = typeOf('bigint');
export const boolean     = typeOf('boolean');
export const func        = typeOf('function');
export const symbol      = typeOf('symbol');
export const undefined_  = typeOf('undefined');
export const null_       = v => v === null;
export const nullish     = v => v == null;
export const defined     = v => v !== undefined;
export const primitive   = v => v !== Object(v);

// Numbers
export const nan         = Number.isNaN;
export const number      = and(typeOf('number'), not(nan));
export const integer     = Number.isInteger;
export const finite      = Number.isFinite;
export const float       = and(typeOf('number'), not(nan), not(integer));
export const even        = and(integer, v => v % 2 === 0);
export const odd         = and(integer, v => Math.abs(v % 2) === 1);
export const positive    = and(number, v => v > 0);
export const negative    = and(number, v => v < 0);
export const zero        = v => v === 0;

export const numericString = v => string(v) && v.trim() !== '' && !nan(Number(v));
export const numeric       = or(number, numericString);
export const year          = v => (number(v) || numericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999;

// Objects & Data Structures
export const array        = Array.isArray;
export const object       = v => Boolean(v) && typeof v === 'object' && !array(v);
export const plainObject  = v => v !== null && typeof v === 'object' && v.constructor === Object;
export const realObject   = v => v?.constructor === Object;
export const strictObject = v => Object.prototype.toString.call(v) === '[object Object]';
export const map          = instanceOf(typeof Map !== 'undefined' ? Map : null);
export const set          = instanceOf(typeof Set !== 'undefined' ? Set : null);
export const date         = v => instanceOf(Date)(v) && !nan(v.getTime());
export const date2        = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!nan(Date.parse(v)) && nan(Number(v)));
export const regExp       = instanceOf(RegExp);
export const promise      = instanceOf(Promise);
export const error        = instanceOf(Error);
export const buffer       = v => typeof Buffer !== 'undefined' && Buffer.isBuffer(v);

export const iterable       = v => v != null && typeof v[Symbol.iterator] === 'function';
export const asyncIterable  = v => v != null && typeof v[Symbol.asyncIterator] === 'function';

// DOM & Environment (SSR-Safe)
export const node         = instanceOf(typeof Node !== 'undefined' ? Node : null);
export const domNode      = node;
export const element      = instanceOf(typeof Element !== 'undefined' ? Element : null);
export const fragment     = instanceOf(typeof DocumentFragment !== 'undefined' ? DocumentFragment : null);
export const canvas       = instanceOf(typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement : null);
export const elementish   = or(element, fragment, instanceOf(typeof Document !== 'undefined' ? Document : null));
export const realNodeList = instanceOf(typeof NodeList !== 'undefined' ? NodeList : null);
export const nodeList     = v => (realNodeList(v) || array(v)) && [...v].every(node);

export const internalUrl  = v => string(v) && typeof window !== 'undefined' && v.startsWith(window.location.origin);
export const externalUrl  = v => string(v) && typeof window !== 'undefined' && !v.startsWith(window.location.origin);

// Emptiness & Logic
export const blank        = v => v === null || v === undefined || v === '';
export const emptyString   = v => !v || v.length === 0;
export const emptyArray    = and(array, v => v.length === 0);
export const emptyMap      = and(map, v => v.size === 0);
export const emptySet      = and(set, v => v.size === 0);
export const emptyObject   = and(plainObject, v => Object.keys(v).length === 0);
export const empty         = or(v => v === '', v => v?.length === 0, emptyMap, emptySet, emptyObject);
export const falsy         = v => !v && v !== 0 && v !== false;
export const filled        = and(not(blank), not(empty), not(emptyObject));

// Formats & Parsing
export const alphaNumeric = matches(/^[a-z0-9]+$/i);
export const base64       = matches(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
export const email        = matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
export const hexColor     = matches(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
export const uuid         = matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
export const json         = v => { if (!string(v)) return false; try { JSON.parse(v); return true; } catch { return false; } };
export const url          = v => { try { new URL(v); return true; } catch { return false; } };
export const html         = v => string(v) && /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test(v.trim());

// String Cases
export const lowerCase    = and(string, v => v === v.toLowerCase());
export const upperCase    = and(string, v => v === v.toUpperCase());
export const camelCase    = and(matches(/^[a-z][a-zA-Z0-9]*$/), not(upperCase));
export const constantCase = matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/);
export const kebabCase    = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const pascalCase   = matches(/^[A-Z][a-zA-Z0-9]*$/);
export const snakeCase    = matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

// Lists
export const entriesList  = v => array(v) && v.every(item => array(item) && item.length === 2);
export const objectList   = v => array(v) && v.every(object);
export const stringList   = v => array(v) && v.every(string);

// ============================================================================
// 3. PREDICATE REGISTRY & DYNAMIC IS PROXY
// ============================================================================

const predicates = {
  alphaNumeric, array, asyncIterable, base64, bigInt, blank, boolean, buffer,
  canvas, date, date2, defined, domNode, element, elementish, email, empty,
  emptyArray, emptyMap, emptyObject, emptySet, emptyString, error, even,
  externalUrl, falsy, filled, finite, float, fragment, function: func, hexColor,
  integer, internalUrl, iterable, json, map, nan, negative, node, null: null_,
  nullish, number, numeric, numericString, object, plainObject, realObject,
  strictObject, odd, positive, primitive, promise, regExp, set, string, symbol,
  undefined: undefined_, url, uuid, year, zero, html, camelCase, constantCase,
  kebabCase, lowerCase, pascalCase, snakeCase, upperCase, entriesList, nodeList,
  realNodeList, objectList, stringList
};

// Evaluator for single/multiple rules () and []
const evalRule = (rule, val) => {
  if (typeof rule === 'string') return predicates[rule]?.(val) ?? false;
  if (typeof rule === 'function') return rule(val);
  if (Array.isArray(rule)) return rule.every(r => evalRule(r, val));
  return false;
};

// Curried syntax creator: is('string')(val) or is([number, even])(val)
const createChecker = rule => val => evalRule(rule, val);

// The `is` Proxy: supports is.string(v), is('string')(v), is([p1, p2])(v)
export const is = new Proxy(createChecker, {
  get(target, prop) {
    if (prop in predicates) return predicates[prop];
    return target[prop];
  }
});

// ============================================================================
// 4. BACKWARD COMPATIBLE EXPORTS (isX Alias Exports)
// ============================================================================

export const isAlphaNumeric  = alphaNumeric;
export const isArray         = array;
export const isAsyncIterable = asyncIterable;
export const isBase64        = base64;
export const isBigInt        = bigInt;
export const isBlank         = blank;
export const isBoolean       = boolean;
export const isBuffer        = buffer;
export const isCanvas        = canvas;
export const isDate          = date;
export const isDate2         = date2;
export const isDefined       = defined;
export const isDomNode       = domNode;
export const isElement       = element;
export const isElementish    = elementish;
export const isEmail         = email;
export const isEmpty         = empty;
export const isEmptyArray    = emptyArray;
export const isEmptyMap      = emptyMap;
export const isEmptyObject   = emptyObject;
export const isEmptySet      = emptySet;
export const isEmptyString   = emptyString;
export const isError         = error;
export const isEven          = even;
export const isExternalUrl   = externalUrl;
export const isFalsy         = falsy;
export const isFilled        = filled;
export const isFinite        = finite;
export const isFloat         = float;
export const isFragment      = fragment;
export const isFunction      = func;
export const isHexColor     = hexColor;
export const isInteger       = integer;
export const isInternalUrl   = internalUrl;
export const isIterable      = iterable;
export const isJSON          = json;
export const isMap           = map;
export const isNaN           = nan;
export const isNegative      = negative;
export const isNode          = node;
export const isNull         = null_;
export const isNullish       = nullish;
export const isNumber        = number;
export const isNumeric       = numeric;
export const isNumericString = numericString;
export const isObject        = object;
export const isPlainObject   = plainObject;
export const isRealObject    = realObject;
export const isStrictObject  = strictObject;
export const isOdd           = odd;
export const isPositive      = positive;
export const isPrimitive     = primitive;
export const isPromise       = promise;
export const isRegExp        = regExp;
export const isSet           = set;
export const isString        = string;
export const isSymbol        = symbol;
export const isUndefined     = undefined_;
export const isUrl           = url;
export const isUUID          = uuid;
export const isYear          = year;
export const isZero          = zero;
export const isHTML          = html;

export const isCamelCase     = camelCase;
export const isConstantCase  = constantCase;
export const isKebabCase     = kebabCase;
export const isLowerCase     = lowerCase;
export const isPascalCase    = pascalCase;
export const isSnakeCase     = snakeCase;
export const isUpperCase     = upperCase;

export const isEntriesList   = entriesList;
export const isNodeList      = nodeList;
export const isRealNodeList  = realNodeList;
export const isObjectList    = objectList;
export const isStringList    = stringList;
