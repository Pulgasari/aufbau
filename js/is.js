// @aufbau/js/is.js

import * as predicates from './predicates.js';

// ============================================================================
// 1. REGISTRY
// ============================================================================

// null-prototype: inherited keys like 'constructor' or 'toString' cannot leak through
// the proxy, and the lookup skips the prototype chain
const registry = Object.assign(Object.create(null), predicates, {
  function  : predicates.func,
  null      : predicates.null_,
  undefined : predicates.undefined_
});

// ============================================================================
// 2. RULE EVALUATION
// ============================================================================

// the single evaluator behind `is` and `match`
//   function -> called with the value
//   string   -> looked up in the registry
//   array    -> every entry must match (AND), nesting allowed
//   boolean  -> used as-is, handy for feature flags in rule tables
export const test = (rule, value) => {
  if (typeof rule === 'function') return rule(value);
  if (typeof rule === 'string') {
    const check = registry[rule];
    return check === undefined ? false : check(value);
  }
  if (Array.isArray(rule)) {
    for (let index = 0; index < rule.length; index++) if (!test(rule[index], value)) return false;
    return true;
  }
  if (typeof rule === 'boolean') return rule;
  return false;
};

const createChecker = (rule) => (value) => test(rule, value);

// ============================================================================
// 3. THE `is` PROXY
// ============================================================================

// three call styles:
//   is.string(value)             direct predicate access
//   is('string')(value)          rule by name, e.g. from an attribute or json config
//   is([number, even])(value)    combined rules
// unknown string keys resolve to undefined instead of falling through to Function.prototype:
// is[nameFromUserData] must never hand out call/bind/constructor.
// note: every property access runs the trap, so destructure once in hot code
export const is = new Proxy(createChecker, {
  get (target, key) {
    if (typeof key === 'symbol') return Reflect.get(target, key);
    return registry[key];
  }
});

// ============================================================================
// 4. isX ALIASES
// ============================================================================

export const {
  alphaNumeric: isAlphaNumeric,
  array: isArray,
  asyncIterable: isAsyncIterable,
  base64: isBase64,
  bigInt: isBigInt,
  blank: isBlank,
  blankish: isBlankish,
  boolean: isBoolean,
  buffer: isBuffer,
  camelCase: isCamelCase,
  canvas: isCanvas,
  constantCase: isConstantCase,
  date: isDate,
  dateString: isDateString,
  defined: isDefined,
  domNode: isDomNode,
  element: isElement,
  elementish: isElementish,
  email: isEmail,
  empty: isEmpty,
  emptyArray: isEmptyArray,
  emptyMap: isEmptyMap,
  emptyObject: isEmptyObject,
  emptySet: isEmptySet,
  emptyString: isEmptyString,
  entriesList: isEntriesList,
  error: isError,
  even: isEven,
  externalUrl: isExternalUrl,
  filled: isFilled,
  finite: isFinite,
  float: isFloat,
  func: isFn,
  fragment: isFragment,
  func: isFunction,
  html: isHTML,
  hexColor: isHexColor,
  integer: isInteger,
  internalUrl: isInternalUrl,
  iterable: isIterable,
  json: isJSON,
  kebabCase: isKebabCase,
  lowerCase: isLowerCase,
  map: isMap,
  nan: isNaN,
  negative: isNegative,
  node: isNode,
  nodeList: isNodeList,
  null_: isNull,
  nullish: isNullish,
  number: isNumber,
  numeric: isNumeric,
  numericString: isNumericString,
  object: isObject,
  objectList: isObjectList,
  odd: isOdd,
  pascalCase: isPascalCase,
  plainObject: isPlainObject,
  positive: isPositive,
  primitive: isPrimitive,
  promise: isPromise,
  realNodeList: isRealNodeList,
  realObject: isRealObject,
  regExp: isRegExp,
  set: isSet,
  snakeCase: isSnakeCase,
  strictObject: isStrictObject,
  string: isString,
  stringList: isStringList,
  symbol: isSymbol,
  uuid: isUUID,
  undefined_: isUndefined,
  upperCase: isUpperCase,
  url: isUrl,
  year: isYear,
  zero: isZero
} = predicates;

// deprecated aliases, kept for compatibility with the first draft
export const isDate2 = predicates.dateString;
export const isFalsy = predicates.blankish;
