// @aufbau/utils/is.js

// ???
//isEDO    = v => isObject(v) && (v.tag || v.tagName),
//isEmpty  = v => v === '' || v === null || v === undefined,
//isHTML   = v => isString(v) && v.trim().startsWith('<'),
//isIdLike = v => v.charCodeAt(0) === 35 && v.indexOf(' ') === -1 && v.indexOf('.') === -1,
//isDings  = el => el.type === 'checkbox' || el.type === 'radio',
//isMulti  = el => el.tagName === 'SELECT' && el.multiple,
//isURL    = v => isString(v) && v.includes('://');

export let // checks
isAlphaNumeric  = v => typeof v === 'string' && /^[a-z0-9]+$/i.test(v),
isArray         = v => Array.isArray(v),
isAsyncIterable = v => v != null && typeof v[Symbol.asyncIterator] === 'function',
isBase64        = v => typeof v === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v),
isBigInt        = v => typeof v === 'bigint',
isBlank         = v => v === null || v === undefined || v === '',
isBoolean       = v => typeof v === 'boolean',
isBuffer        = v => typeof Buffer !== 'undefined' && Buffer.isBuffer(v),
isCanvas        = v => v instanceof HTMLCanvasElement,
isDate          = v => v instanceof Date && !isNaN(v.getTime()),
isDate2         = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))),
isDefined       = v => v !== undefined,
isDomNode       = v => typeof Node !== 'undefined' && v instanceof Node,
isElement       = v => typeof Element !== 'undefined' && v instanceof Element,
isElementish    = v => v instanceof Element || v instanceof DocumentFragment || v instanceof Document,
isEmail         = v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
isEmpty         = v => v === '' || v.length === 0,
isEmptyArray    = v => Array.isArray(v) && v.length === 0,
isEmptyMap      = v => v instanceof Map && v.size === 0,
isEmptyObject   = v => isPlainObject(v) && Object.keys(v).length === 0,
isEmptySet      = v => v instanceof Set && v.size === 0,
isEmptyString   = v => !v || v.length === 0,
isError         = v => v instanceof Error,
isEven          = v => isInteger(v) && v % 2 === 0,
isExternalUrl   = v => !v.startsWith(window.location.origin),
isFalsy         = v => !v && v !== 0 && v !== false,
isFilled        = v => !isBlank(v) && !isEmpty(v) && !isEmptyObject(v),
isFinite        = v => Number.isFinite(v),
isFloat         = v => typeof v === 'number' && !Number.isNaN(v) && !Number.isInteger(v),
isFragment      = v => v instanceof DocumentFragment,
isFunction      = v => typeof v === 'function',
isHexColor      = v => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v),
isInteger       = v => Number.isInteger(v),
isInternalUrl   = v => v.startsWith(window.location.origin),
isIterable      = v => v != null && typeof v[Symbol.iterator] === 'function',
isJSON          = v => { if (typeof v !== 'string') return false; try { JSON.parse(v); return true } catch { return false } },
isMap           = v => v instanceof Map,
isNaN           = v => Number.isNaN(v),
isNegative      = v => typeof v === 'number' && v < 0,
isNode          = v => v instanceof Node,
isNull          = v => v === null,
isNullish       = v => v == null,
isNumber        = v => typeof v === 'number' && !isNaN(v),
isNumeric       = v => (typeof v === 'number' && !Number.isNaN(v)) || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))),
isNumericString = v => typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)),
isObject        = v => v && typeof v === 'object' && !isArray(v) && v !== null,
 isPlainObject  = v => v !== null && typeof v === 'object' && v.constructor === Object, // !!sth ???
 isRealObject   = v => v?.constructor === Object,
 isStrictObject = v => Object.prototype.toString.call(v) === '[object Object]',
isOdd           = v => isInteger(v) && Math.abs(v % 2) === 1,
isPositive      = v => typeof v === 'number' && v > 0,
isPrimitive     = v => v !== Object(sth),
isPromise       = v => v instanceof Promise,
isRegExp        = v => v instanceof RegExp,
isSet           = v => v instanceof Set,
isString        = v => typeof v === 'string',
isSymbol        = v => typeof v === 'symbol',
isUndefined     = v => v === undefined,
isUrl           = v => { try { new URL(v); return true } catch { return false } },
isUUID          = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
isYear          = v => (typeof v === 'number' || isNumericString(v)) && /^\d{4}$/.test(String(v)) && +v >= 0 && +v <= 9999,
isZero          = v => v === 0,
isHTML          = v => !isString(v) ? false : /^<([a-z]+)(\s[^>]*)?>.*<\/\1>$|^<([a-z]+)(\s[^>]*)?\/?>$/i.test( v.trim() ),

// String Cases
isCamelCase     = v => /^[a-z][a-zA-Z0-9]*$/.test(v) && !isUpperCase(v),
isConstantCase  = v => /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(v),
isKebabCase     = v => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
isLowerCase     = v => typeof v === 'string' && v === v.toLowerCase(),
isPascalCase    = v => /^[A-Z][a-zA-Z0-9]*$/.test(v),
isSnakeCase     = v => /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(v),
isUpperCase     = v => typeof v === 'string' && v === v.toUpperCase(),

// Lists
// isList
isEntriesList   = v => Array.isArray(v) && input.every( item => Array.isArray(item) && item.length === 2),
isNodeList      = v => (v instanceof NodeList || isArray(v)) && [...v].every(isNode),
isRealNodeList  = v => typeof NodeList !== 'undefined' && v instanceof NodeList,
isObjectList    = v => isArray(v) && v.every(isObject),
isStringList    = v => isArray(v) && v.every(isString);

export let // bridges for multi-checking (could take conditions and the is-methods)
isEvery = (fn, ...sth) =>  sth.every (fn),
isAny   = (fn, ...sth) =>  sth.some  (fn),
isNone  = (fn, ...sth) => !sth.some  (fn);

export let // special
isInstanceOf = (Constructor, sth) => sth instanceof Constructor;

export let // export as alias
isArr   = isArray,
isBool  = isBoolean,
isFn    = isFunction,
isRegEx = isRegExp,
isStr   = isString;
