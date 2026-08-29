// @aufbau/signals

// :::::: IMPORT

import { useEffect, useRef }                           from 'preact/hooks';
import { computed, effect, signal, Signal, useSignal } from '@preact/signals';
import { createStorage } from '@bunker/storage';

import { isBool, isFn, isNumber } from '@pulgasari/is';
import obj from '@pulgasari/obj';

import { makeMap, makeSet } from './make.js';


// TODO: should `values` also apply to leaves inside a deep object?
//       e.g. deep: { size: ['s','m','l'] } — structure carrying both. undecided.
// TODO: back this with @bunker/db — the interface already allows an async get(), so
//       it can be added without touching anything else here.

// :::::: HELPERS

let isAbort       = error => error?.name === 'AbortError';
let isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
let isPromise     = value => value !== null && typeof value?.then === 'function';
//let isNode        = value => value !== null && typeof value === 'object' && _meta.has(value);

/*
let isObject      = value => value !== null && typeof value === 'object';
let isPlainObject = value => isObject(value) && (value.constructor === Object || !value.constructor);
let isPromise     = value => isObject(value) && typeof value.then === 'function';
let isNode        = value => isObject(value) && _meta.has(value);
*/










// :::::: EXPORT

export * from './fetchers.js';
export * from './hooks.js';
export * from './make.js';

export * from './querySignal.js';





/*
function deleteKeyFromSignalObject(signal, key) {
  const { [key]: _, ...rest } = signal.value;  // destructuring + rest
  signal.value = rest;
}

// oder explizit mit delete (wie im Original)
function deleteKeyFromSignalObject(signal, key) {
  const copy = { ...signal.value };
  delete copy[key];
  signal.value = copy;
}

function setSignalObject(signal, key, value) {
  signal.value = { ...signal.value, [key]: value };
}

// Verwendung:
setSignalObject(this._perms, id, 'granted');
setSignalObject(this._scanning, id, true);

function removeFromSignalObjectListByPredicate(signal, predicate) {
  signal.value = signal.value.filter(item => !predicate(item));
}

// Entfernt Elemente, bei denen ALLE Kriterien erfüllt sind (AND)
function removeFromSignalObjectListByCriteria(signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).every(key => item[key] === criteria[key])
  );
}

// Entfernt Elemente, bei denen MINDESTENS EIN Kriterium erfüllt ist (OR)
function removeFromSignalObjectListByAnyCriteria(signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).some(key => item[key] === criteria[key])
  );
}

function removeFromSignalObjectListByCriteria (signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).every(key => {
      const criterion = criteria[key];
      return typeof criterion === 'function'
        ? criterion(item[key])
        : item[key] === criterion;
    })
  );
}
*/

/*
let createTarget = ({ type, deep, value, values }) => {
  if (type === Map) {
    let target = makeMap(value);
    return {
      target,
      read: () => target.toObject(),
      write: saved => target.replace(saved),
    };
  }

  if (type === Set) {
    let target = makeSet(value);
    return {
      target,
      read: () => target.toArray(),
      write: saved => target.replace(saved),
    };
  }

  if (deep) {
    let target = _makeNode(value ?? {}, deep);
    return {
      target,
      read: () => target.$signal.value,
      write: saved => _merge(target, saved),
    };
  }

  let target = new XSignal(value, values);

  return {
    target,
    read: () => target.value,
    write: saved => {
      target.$values = null;
      target.value = saved;
      target.$values = values ?? null;
    },
  };
};
*/

/*
export const betterSignal = input => {
  const config = isPlainObject(input) ? input : { value: input };
  const target = createTarget(config);
  const store  = resolveStore(config.store);

  if (config.key == null) return target.value;

  attachPersistence (target, store, config.key);
  return target.value;
};

const createTarget = ({ type, deep, value, values }) => {
  if (type === Map) return createMapTarget    (value);
  if (type === Set) return createSetTarget    (value);
  if (deep)         return createDeepTarget   (value, deep);
                    return createScalarTarget (value, values);
};
*/
/*
const attachPersistence = (target, store, key) => {
  let live  = false;
  let saved = store.get(key);

  const apply = value => {
    if (value !== undefined) target.write(value);
  };

  const ready = isPromiseLike (saved)
    ? saved.then (value => { apply(value); live = true; })
    : (() => { apply(saved); live = true; return Promise.resolve(); })();

  effect(() => {
    target.read();
    if (live) store.set(key, target.read());
  });

  store.subscribe?.(key, apply);

  target.setReady(ready);
};
*/
