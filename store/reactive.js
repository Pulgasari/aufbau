// @aufbau/store/reactive.js
// small, zero-dependency reactive core (home-grown, browser-first). push-pull
// signals: signals push invalidation to their observers, computeds recompute
// lazily on read. no external engine — the store owns its reactivity.
//
// signal(v)      -> { value (get/set), peek() }
// computed(fn)   -> { value, peek() }         derived, memoized, read-only
// effect(fn)     -> dispose()                 runs now + on any read dep change; fn may return a cleanup
// batch(fn)      -> collapses notifications until fn returns
// untracked(fn)  -> reads without subscribing

let currentObserver = null;   // the effect/computed currently tracking reads
let batchDepth = 0;
let flushing   = false;
const queue    = new Set();   // effects waiting to re-run

function unlink (node) {
  for (const dep of node.deps) dep.observers.delete(node);
  node.deps.clear();
}

function track (producer) {
  if (currentObserver) { producer.observers.add(currentObserver); currentObserver.deps.add(producer); }
}

function flush () {
  if (flushing || batchDepth > 0) return;
  flushing = true;
  try {
    while (queue.size) {
      const effects = [...queue];
      queue.clear();
      for (const effect of effects) if (!effect.disposed) effect.run();
    }
  } finally { flushing = false; }
}

export function signal (value) {
  const producer = {
    observers: new Set(),
    peek () { return value; },
    get value () { track(producer); return value; },
    set value (next) {
      if (next === value) return;
      value = next;
      for (const observer of [...producer.observers]) observer.notify();
      flush();
    },
  };
  return producer;
}

export function computed (fn) {
  let value;
  let dirty = true;
  const node = {
    deps: new Set(),
    observers: new Set(),
    notify () { if (!dirty) { dirty = true; for (const observer of [...node.observers]) observer.notify(); } },
    recompute () {
      unlink(node);
      const prev = currentObserver;
      currentObserver = node;
      try { value = fn(); dirty = false; }
      finally { currentObserver = prev; }
    },
    peek () { if (dirty) node.recompute(); return value; },
    get value () { if (dirty) node.recompute(); track(node); return value; },
  };
  return node;
}

export function effect (fn) {
  const node = {
    deps: new Set(),
    disposed: false,
    cleanup: undefined,
    notify () { queue.add(node); },
    run () {
      if (node.disposed) return;
      unlink(node);
      if (typeof node.cleanup === 'function') node.cleanup();
      const prev = currentObserver;
      currentObserver = node;
      try { node.cleanup = fn(); }
      finally { currentObserver = prev; }
    },
    dispose () {
      if (node.disposed) return;
      node.disposed = true;
      unlink(node);
      if (typeof node.cleanup === 'function') node.cleanup();
    },
  };
  node.run();
  return () => node.dispose();
}

export function batch (fn) {
  batchDepth++;
  try { return fn(); }
  finally { if (--batchDepth === 0) flush(); }
}

export function untracked (fn) {
  const prev = currentObserver;
  currentObserver = null;
  try { return fn(); }
  finally { currentObserver = prev; }
}
