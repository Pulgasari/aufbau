// @aufbau/signals/DeepSignal.js
// deep signals — each leaf property is an independent signal, so a mutation only
// wakes the effects that read that exact leaf. nodes are Proxies (not a class): the
// per-leaf identity is the whole point, and a Proxy is what delivers it.

// :::::: IMPORT

import {
  computed, effect, signal, untracked,
  isNumber, isPlainObject, obj,
} from './shared.js';

// :::::: INTERNALS

let _leaves = new WeakSet;
let _meta   = new WeakMap;

let isLeaf = value => _leaves.has(value);
let isNode = value => value !== null && typeof value === 'object' && _meta.has(value);

// deep spec: true = unlimited, number = remaining levels, object = explicit shape
let descend = (spec, key) =>
    spec === true       ? true
  : isNumber(spec)      ? spec - 1
  : isPlainObject(spec) ? (spec[key] ?? false)
  : false;

let makeLeaf = value => {
  let leaf = signal(value);
  _leaves.add(leaf);
  return leaf;
};

let spawn = (value, spec) => spec && isPlainObject(value) ? makeNode(value, spec) : makeLeaf(value);

// reactive=true  -> tracks every descendant signal (for effect/computed)
// reactive=false -> peek only, no subscriptions created
let raw = ({ children, keysSignal }, reactive) => {
  if (reactive) void keysSignal.value;
  let out = {};
  for (let [key, child] of children)
    out[key] = isLeaf(child)
      ? (reactive ? child.value : child.peek())
      : raw(_meta.get(child), reactive);
  return out;
};

let makeNode = (object, spec = true) => {
  let children   = new Map;
  let keysSignal = signal(Object.keys(object));
  let syncKeys   = () => { keysSignal.value = [...children.keys()]; };
  let meta       = { children, keysSignal, syncKeys, ready: null, sig: null, spec };

  for (let key of keysSignal.peek())
    children.set(key, spawn(object[key], descend(spec, key)));

  let proxy = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      switch (key) {
        case '$keys'    : return keysSignal.value;
        case '$peek'    : return () => raw(meta, false);
        case '$raw'     : return raw(meta, true);
        case '$ready'   : return meta.ready;
        case '$signal'  : return meta.sig ??= computed(() => raw(meta, true));
        case '$toggle'  : return dotKey => obj(proxy).toggleByPath(dotKey);
        case '$replace' : return source => merge(proxy, source);
        case '$update'  : return patch => {
          for (let [key, value] of Object.entries(patch))
            isPlainObject(value) && isNode(children.get(key)) ? proxy[key].$update(value) : proxy[key] = value;
        };
        case '$onEffect' : return (targetKey, callback) => effect(() => {
          // touch keys so a later-added targetKey re-evaluates this effect
          void keysSignal.value;
          if (!(targetKey in proxy)) return;
          // keep the callback's own signal reads out of this effect's dependencies
          let value = proxy[targetKey];
          untracked(() => callback(value));
        });
        case '$onEffects' : return listeners => {
          let disposers = Object.entries(listeners).map(([key, callback]) => proxy.$onEffect(key, callback));
          return () => disposers.forEach(dispose => dispose?.());
        };
      }

      let child = children.get(key);
      if (child === undefined) return undefined;
      return isLeaf(child) ? child.value : child;
    },

    set (_, key, value) {
      if (typeof key === 'symbol') return true;
      // reserved accessors are read-only, except $ready which persistence writes
      if (key[0] === '$') { if (key === '$ready') meta.ready = value; return true; }

      let child = children.get(key);

      if (child !== undefined) {
        if (isLeaf(child) && !isPlainObject(value)) { child.value = value; return true; } // scalar->scalar: minimal blast radius
        if (isNode(child) &&  isPlainObject(value)) { merge(child, value); return true; } // object->object: deep merge, preserves signals
        // type changed (scalar<->object): replace — old consumers stop updating, correct by design
      }

      children.set(key, spawn(value, descend(spec, key)));
      if (child === undefined) syncKeys();
      return true;
    },

    deleteProperty (_, key) {
      if (children.delete(key)) syncKeys();
      return true;
    },

    has     (_, key) { return children.has(key); },
    ownKeys (_)      { void keysSignal.value; return [...children.keys()]; },
    getOwnPropertyDescriptor (_, key) {
      return children.has(key)
        ? { configurable: true, enumerable: true, writable: true }
        : undefined;
    },
  });

  _meta.set(proxy, meta);
  return proxy;
};

// full replace: writes every key of `object`, then drops the ones it no longer carries
let merge = (proxy, object) => {
  let { children, syncKeys } = _meta.get(proxy);
  let keys        = new Set(Object.keys(object));
  let changedKeys = false;

  for (let key of keys) proxy[key] = object[key];
  for (let key of children.keys()) {
    if (!keys.has(key)) { children.delete(key); changedKeys = true; }
  }
  if (changedKeys) syncKeys(); // fire the keys signal exactly once
};

// :::::: MAIN

let deepSignal = (object = {}, spec = true) => makeNode(object, spec);

let isDeep = value => isNode(value);

// :::::: EXPORT
// the deep node builder is a Proxy factory, so there is no `DeepSignal` class to pair
// with it — `deepSignal` is the whole public surface, `isDeep` the brand check.

export       { deepSignal, isDeep, makeNode as makeDeep, merge as mergeDeep };
export default deepSignal;
