// @domina/observer.js

import { _doc, _el, _slct, getElements }              from './core.js';
import { arrayfied, isArray, isObject, isElementish } from './utils.js';

//========================================================================
// INTERNAL SHORTHANDS
//========================================================================

const
MO = callback            => new     MutationObserver(callback),
IO = (callback, options) => new IntersectionObserver(callback, options),
RO = callback            => new       ResizeObserver(callback),

$root = document.documentElement,

STRUCTURAL = { childList: true, subtree: true },

ensureBody = callback => {
  if (document.body) return callback();
  let observer = MO(() => document.body && (observer.disconnect(), callback()));
  observer.observe($root, STRUCTURAL);
},

traverseNodes = (nodes, selector, callback) => {
  for (const node of arrayfied(nodes)) {
    if (node.nodeType !== 1) continue;
    if (node.matches(selector)) callback(node);
    node.querySelectorAll(selector).forEach(callback);
  }
},

// Ein Handler ist entweder eine Funktion oder { ...options, handler }
normalize = handler =>
  typeof handler === 'function' ? { handler }
: isObject(handler) && typeof handler.handler === 'function' ? { ...handler }
: null;

//========================================================================
// REGISTRY — ein Eintrag pro Root, geteilt von allen Subscribern
//========================================================================

const registry = new WeakMap(); // root -> entry

const entryOf = root => {
  let entry = registry.get(root);
  if (!entry) registry.set(root, entry = {
    root,
    subs       : new Set(),
    structural : null,  // MutationObserver | null
    attrs      : null,  // MutationObserver | null
    filter     : new Set(),  // Attributnamen; null == "alle"
  });
  return entry;
};

//----- Struktur (childList + subtree)
const ensureStructural = entry => {
  if (entry.structural) return;
  entry.structural = MO(records => {
    for (const sub of entry.subs) {
      if (!sub.structural) continue;
      for (const { addedNodes, removedNodes } of records) {
        if (removedNodes.length) onRemovedNodes(sub, removedNodes);
        if (addedNodes.length)   onAddedNodes(sub, addedNodes);
      }
    }
  });
  ensureBody(() => entry.structural.observe(entry.root, STRUCTURAL));
};

const onAddedNodes = (sub, nodes) => {
  if (sub.selector) return traverseNodes(nodes, sub.selector, element => enter(sub, element, false));
  // Einzelnes Element: nur relevant, wenn es (wieder) im Baum hängt
  if (sub.element.isConnected) enter(sub, sub.element, false);
};

const onRemovedNodes = (sub, nodes) => {
  if (sub.selector) return traverseNodes(nodes, sub.selector, element => release(sub, element, true));
  for (const node of nodes)
    if (node === sub.element || node.contains?.(sub.element))
      return release(sub, sub.element, true);
};

//----- Attribute (attributes + subtree)
const ensureAttrs = entry => {
  // Filter-Union neu bestimmen; einmal null, immer null
  if (entry.filter) {
    for (const sub of entry.subs) {
      if (!sub.attrs) continue;
      if (sub.attrs.all) { entry.filter = null; break; }
      for (const name of sub.attrs.names) entry.filter.add(name);
    }
  }

  const options = { attributes: true, attributeOldValue: true, subtree: true };
  if (entry.filter) options.attributeFilter = [...entry.filter];

  if (!entry.attrs) entry.attrs = MO(records => dispatchAttrs(entry, records));
  // Erneutes observe() auf demselben Target ersetzt die Options -> weitet den Filter
  ensureBody(() => entry.attrs.observe(entry.root, options));
};

const dispatchAttrs = (entry, records) => {
  // Coalescing: pro (element, name) das aelteste oldValue behalten
  const batch = new Map();
  for (const { target, attributeName: name, oldValue } of records) {
    let names = batch.get(target);
    if (!names) batch.set(target, names = new Map());
    if (!names.has(name)) names.set(name, oldValue);
  }

  for (const [element, names] of batch)
  for (const [name, old] of names) {
    const value = element.getAttribute(name); // null == entfernt
    for (const sub of entry.subs) {
      const handler = attrHandlerFor(sub, name);
      if (handler && matches(sub, element)) handler(element, { name, value, old });
    }
  }
};

const attrHandlerFor = (sub, name) =>
  !sub.attrs ? null : sub.attrs.all || sub.attrs.byName.get(name) || null;

//========================================================================
// SHARED INTERSECTION / RESIZE POOLS
//========================================================================

const ioPool = new Map(); // signature -> { observer, targets }

const ioEntry = options => {
  const signature = JSON.stringify([
    options.rootMargin ?? '', options.threshold ?? 0
  ]);
  let pool = ioPool.get(signature);
  if (!pool) {
    const targets = new Map(); // element -> Set<callback>
    const observer = IO(items => {
      for (const item of items) targets.get(item.target)?.forEach(callback => callback(item));
    }, options);
    ioPool.set(signature, pool = { observer, targets });
  }
  return pool;
};

// ResizeObserver hat keine observerweiten Options -> genau einer reicht global
let roPool = null;
const roEntry = () => {
  if (!roPool) {
    const targets = new Map();
    const observer = RO(items => {
      for (const item of items) targets.get(item.target)?.forEach(callback => callback(item));
    });
    roPool = { observer, targets };
  }
  return roPool;
};

const poolAdd = (pool, element, callback) => {
  let set = pool.targets.get(element);
  if (!set) { pool.targets.set(element, set = new Set()); pool.observer.observe(element); }
  set.add(callback);
};

const poolRemove = (pool, element, callback) => {
  const set = pool.targets.get(element);
  if (!set) return;
  set.delete(callback);
  if (!set.size) { pool.targets.delete(element); pool.observer.unobserve(element); }
};

//========================================================================
// SUBSCRIBER LIFECYCLE
//========================================================================

const matches = (sub, element) =>
  sub.selector ? element.matches(sub.selector) : element === sub.element;

const enter = (sub, element, initial) => {
  if (sub.matched.has(element)) return;
  sub.matched.add(element);

  const detail   = { initial };
  const cleanups = [];
  const collect  = result => { if (typeof result === 'function') cleanups.push(result); };

  collect((initial ? sub.h.onInit : sub.h.onAdded)?.(element, detail));
  collect(sub.h.onMatch?.(element, detail));

  // Per-Element-Observer erst anhaengen, wenn das Element tatsaechlich gematcht hat
  for (const binding of sub.bindings) {
    const { pool, callback } = binding.bind(element);
    poolAdd(pool, element, callback);
    cleanups.push(() => poolRemove(pool, element, callback));
  }

  if (cleanups.length) sub.cleanups.set(element, cleanups);
};

// notify=false beim stop(): onRemoved luegt sonst ("hat das DOM verlassen")
const release = (sub, element, notify) => {
  if (!sub.matched.delete(element)) return;

  if (notify) sub.h.onRemoved?.(element, { initial: false });

  const cleanups = sub.cleanups.get(element);
  sub.cleanups.delete(element);
  if (cleanups) for (let i = cleanups.length; i--;) { try { cleanups[i]() } catch {} }
};

//========================================================================
// PUBLIC: observe
//========================================================================

const HANDLER_KEYS = new Set([
  'onInit', 'onAdded', 'onMatch', 'onRemoved',
  'onAttr', 'onIntersect', 'onVisible', 'onHidden', 'onResize'
]);

const subscribe = (target, { within, ...handlers } = {}) => {
  const root    = _doc(within);
  const entry   = entryOf(root);
  const element = isElementish(target) ? target : null;

  const sub = {
    element,
    selector   : element ? null : _slct(target),
    h          : handlers,
    matched    : new Set(),
    cleanups   : new Map(),
    bindings   : [],
    structural : false,
    attrs      : null,
  };

  //----- Struktur
  sub.structural = !!(handlers.onInit || handlers.onAdded || handlers.onMatch || handlers.onRemoved);

  //----- Attribute
  if (handlers.onAttr) {
    const spec = handlers.onAttr;
    sub.attrs = { all: null, names: [], byName: new Map() };
    if (typeof spec === 'function') sub.attrs.all = spec;
    else for (const [name, handler] of Object.entries(spec)) {
      const norm = normalize(handler);
      if (!norm) continue;
      sub.attrs.names.push(name);
      sub.attrs.byName.set(name, norm.handler);
    }
  }

  //----- Intersection / Resize als Per-Element-Bindings
  const intersect = normalize(handlers.onIntersect);
  const visible   = normalize(handlers.onVisible);
  const hidden    = normalize(handlers.onHidden);

  if (intersect || visible || hidden) {
    const { handler: _drop, ...options } = { ...intersect, ...visible, ...hidden };
    sub.bindings.push({
      bind: element => ({
        pool     : ioEntry({ ...options, root: root === document ? null : root }),
        callback : item => {
          intersect?.handler(element, item);
          if (item.isIntersecting) visible?.handler(element, item);
          else                     hidden?.handler(element, item);
        }
      })
    });
  }

  const resize = normalize(handlers.onResize);
  if (resize) sub.bindings.push({
    bind: element => ({ pool: roEntry(), callback: item => resize.handler(element, item) })
  });

  //----- Anmelden
  entry.subs.add(sub);
  if (sub.structural || sub.bindings.length) ensureStructural(entry);
  if (sub.attrs) ensureAttrs(entry);

  //----- Initial-Scan
  ensureBody(() => {
    if (sub.element) { if (sub.element.isConnected) enter(sub, sub.element, true); return; }
    for (const found of getElements(sub.selector, root)) enter(sub, found, true);
  });

  //----- Disposer
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    for (const element of [...sub.matched]) release(sub, element, false);
    entry.subs.delete(sub);
    if (!entry.subs.size) {
      entry.structural?.disconnect();
      entry.attrs?.disconnect();
      registry.delete(root);
    }
  };
};

/**
 * observe(target, handlers)  -> Disposer
 * observe({ selector: handlers, ... }) -> Disposer (ruft alle einzeln auf)
 */
export const observe = (target, handlers) => {
  const isMap = handlers === undefined
             && isObject(target) && !isElementish(target)
             && Object.values(target).every(value => isObject(value));

  if (!isMap) return subscribe(target, handlers);

  const stops = Object.entries(target).map(([selector, spec]) => subscribe(selector, spec));
  return () => stops.forEach(stop => stop());
};

//========================================================================
// PUBLIC: thin wrappers
//========================================================================

export const
onConnected    = (node,   callback) => observe(node,   { onMatch  : callback }),
onDisconnected = (node,   callback) => observe(node,   { onRemoved: callback }),
onAdded        = (target, callback) => observe(target, { onAdded  : callback }),
onRemoved      = (target, callback) => observe(target, { onRemoved: callback }),
onAttr         = (target, spec)     => observe(target, { onAttr   : spec     }),
onResize       = (target, callback) => observe(target, { onResize : callback }),
onVisible      = (target, callback, options) => observe(target, { onVisible: options ? { ...options, handler: callback } : callback });     
