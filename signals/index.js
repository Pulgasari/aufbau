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




// :::::: EXPORT
// re-export @preact/signals + this packages extension

export * from '@preact/signals';
export * from './signal.js';
export * from './querySignal.js';






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

