// @aufbau/js/is.js

const registry = new Map();
let idCounter = 0;

// Wraps a predicate function and registers a unique key for object property access
export const createPredicate = (fn, name) => {
  const id = name || `__pred_${++idCounter}__`;
  fn.toString = () => id;
  registry.set(id, fn);
  return fn;
};

// :::::: BASE PREDICATES

export const isBlank   = createPredicate((v) => v == null || v === '', 'isBlank');
export const isNumber  = createPredicate((v) => typeof v === 'number' && !Number.isNaN(v), 'isNumber');
export const isEven    = createPredicate((v) => Number.isInteger(v) && v % 2 === 0, 'isEven');
export const isString  = createPredicate((v) => typeof v === 'string', 'isString');
export const isArray   = createPredicate(Array.isArray, 'isArray');
export const isBoolean = createPredicate((v) => typeof v === 'boolean', 'isBoolean');

// Standard constructors alias setup
registry.set('String', isString);
registry.set('Array', isArray);
registry.set('blank', isBlank);

// :::::: COMBINATORS

export const and = (...preds) => {
  return createPredicate((value) => preds.every((p) => p(value)));
};

export const or = (...preds) => {
  return createPredicate((value) => preds.some((p) => p(value)));
};

export const not = (pred) => {
  return createPredicate((value) => !pred(value));
};

// :::::: PATTERN MATCHING

export const match = (rulesObject, fallback = (v) => v) => {
  const compiledRules = Object.entries(rulesObject).map(([key, handler]) => {
    const testFn = registry.get(key) ?? ((v) => String(v) === key);
    return [testFn, handler];
  });

  return (value) => {
    for (let index = 0; index < compiledRules.length; index++) {
      const [testFn, handler] = compiledRules[index];
      if (testFn(value)) {
        return typeof handler === 'function' ? handler(value) : handler;
      }
    }
    return typeof fallback === 'function' ? fallback(value) : fallback;
  };
};

/*
import { match, isBlank, isNumber, isEven, isString, isArray, isBoolean, and, or, not } from './is.js';

const classify = match({
  isBlank                 : 'leer',
  [and(isNumber, isEven)] : value => value * 100,
  [or(isString, isArray)] : value => `text oder array mit länge ${value.length}`,
}, () => 'unbekannt');

classify(null);        // 'leer'
classify(4);           // 400
classify('hi');        // 'text oder array mit länge 2'
classify([1, 2, 3]);   // 'text oder array mit länge 3'
classify(false);       // 'false boolean'
classify(true);        // 'unbekannt'

*/
