// @aufbau/signals/deepSignals.js

// :::::: DEEP SIGNALS
// each leaf property is an independent signal — mutations stay scoped

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

let _makeLeaf = value => {
  let leaf = signal(value);
  _leaves.add(leaf);
  return leaf;
};
let _spawn = (value, spec) => spec && isPlainObject(value) ? _makeNode(value, spec) : _makeLeaf(value);

// reactive=true  -> tracks every descendant signal (for effect/computed)
// reactive=false -> peek only, no subscriptions created
let _raw = ({ children, keysSignal }, reactive) => {
  if (reactive) void keysSignal.value;
  let out = {};
  for (let [key, child] of children)
    out[key] = isLeaf(child)
      ? (reactive ? child.value : child.peek())
      : _raw(_meta.get(child), reactive);
  return out;
};

let _makeNode = (object, spec = true) => {
  let children   = new Map;
  let keysSignal = signal(Object.keys(object));
  let syncKeys   = () => { keysSignal.value = [...children.keys()]; };
  let meta       = { children, keysSignal, syncKeys, ready: null, sig: null, spec };

  

  for (let key of keysSignal.peek())
    children.set(key, _spawn(object[key], descend(spec, key)));

  let proxy = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      switch (key) {
        case '$keys'   : return keysSignal.value;
        case '$peek'   : return () => _raw(meta, false);
        case '$raw'    : return _raw(meta, true);
        case '$ready'  : return meta.ready;
        case '$signal' : return meta.sig ??= computed(() => _raw(meta, true));
        case '$toggle' : return (dotKey) => obj.toggleByDotKey(proxy, dotKey);
        case '$update' : return patch => {
          for (let [k, v] of Object.entries(patch))
            isPlainObject(v) && isNode(children.get(k)) ? proxy[k].$update(v) : proxy[k] = v;
        };
        
      }

      let child = children.get(key);
      if (child === undefined) return undefined;
      return isLeaf(child) ? child.value : child;
    },

    set (_, key, value) {
      if (typeof key === 'symbol') return true;

      let child = children.get(key);

      if (child !== undefined) {
        if (isLeaf(child) && !isPlainObject(value)) { child.value = value; return true; } // scalar->scalar: minimal blast radius
        if (isNode(child) &&  isPlainObject(value)) { _merge(child, value); return true; } // object->object: deep merge, preserves signals
        // type changed (scalar<->object): replace — old consumers stop updating, correct by design
      }

      children.set(key, _spawn(value, descend(spec, key)));
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

let _merge = (proxy, object) => {
  let changedKeys = false;
  let { children, syncKeys } = _meta.get(proxy);
  let keys = new Set(Object.keys(object));
  for (let key of keys) proxy[key] = object[key];
  for (let key of children.keys()) {
    if (!keys.has(key)) {
      children.delete(key);
      changedKeys = true;
    }
  }
  if (changedKeys) syncKeys(); // Trigger signal exactly once
};
