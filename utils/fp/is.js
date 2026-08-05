// @aufbau/utils/fp/is.js

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

export const isAlphaNumeric  = predicates.alphaNumeric;
export const isArray         = predicates.array;
export const isAsyncIterable = predicates.asyncIterable;
export const isBase64        = predicates.base64;
export const isBigInt        = predicates.bigInt;
export const isBlank         = predicates.blank;
export const isBlankish      = predicates.blankish;
export const isBoolean       = predicates.boolean;
export const isBuffer        = predicates.buffer;
export const isCamelCase     = predicates.camelCase;
export const isCanvas        = predicates.canvas;
export const isConstantCase  = predicates.constantCase;
export const isDate          = predicates.date;
export const isDateString    = predicates.dateString;
export const isDefined       = predicates.defined;
export const isDomNode       = predicates.domNode;
export const isElement       = predicates.element;
export const isElementish    = predicates.elementish;
export const isEmail         = predicates.email;
export const isEmpty         = predicates.empty;
export const isEmptyArray    = predicates.emptyArray;
export const isEmptyMap      = predicates.emptyMap;
export const isEmptyObject   = predicates.emptyObject;
export const isEmptySet      = predicates.emptySet;
export const isEmptyString   = predicates.emptyString;
export const isEntriesList   = predicates.entriesList;
export const isError         = predicates.error;
export const isEven          = predicates.even;
export const isExternalUrl   = predicates.externalUrl;
export const isFilled        = predicates.filled;
export const isFinite        = predicates.finite;
export const isFloat         = predicates.float;
export const isFn            = predicates.func;
export const isFragment      = predicates.fragment;
export const isFunction      = predicates.func;
export const isHTML          = predicates.html;
export const isHexColor      = predicates.hexColor;
export const isInteger       = predicates.integer;
export const isInternalUrl   = predicates.internalUrl;
export const isIterable      = predicates.iterable;
export const isJSON          = predicates.json;
export const isKebabCase     = predicates.kebabCase;
export const isLowerCase     = predicates.lowerCase;
export const isMap           = predicates.map;
export const isNaN           = predicates.nan;
export const isNegative      = predicates.negative;
export const isNode          = predicates.node;
export const isNodeList      = predicates.nodeList;
export const isNull          = predicates.null_;
export const isNullish       = predicates.nullish;
export const isNumber        = predicates.number;
export const isNumeric       = predicates.numeric;
export const isNumericString = predicates.numericString;
export const isObject        = predicates.object;
export const isObjectList    = predicates.objectList;
export const isOdd           = predicates.odd;
export const isPascalCase    = predicates.pascalCase;
export const isPlainObject   = predicates.plainObject;
export const isPositive      = predicates.positive;
export const isPrimitive     = predicates.primitive;
export const isPromise       = predicates.promise;
export const isRealNodeList  = predicates.realNodeList;
export const isRealObject    = predicates.realObject;
export const isRegExp        = predicates.regExp;
export const isSet           = predicates.set;
export const isSnakeCase     = predicates.snakeCase;
export const isStrictObject  = predicates.strictObject;
export const isString        = predicates.string;
export const isStringList    = predicates.stringList;
export const isSymbol        = predicates.symbol;
export const isUUID          = predicates.uuid;
export const isUndefined     = predicates.undefined_;
export const isUpperCase     = predicates.upperCase;
export const isUrl           = predicates.url;
export const isYear          = predicates.year;
export const isZero          = predicates.zero;

// deprecated aliases, kept for compatibility with the first draft
export const isDate2 = predicates.dateString;
export const isFalsy = predicates.blankish;
