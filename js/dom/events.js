// @aufbau/js/events.js

// :::::: HELPERS

const toTargets = (value) =>
    value == null                                   ? []
  : typeof value.addEventListener === 'function'    ? [value]
  : typeof value[Symbol.iterator] === 'function'    ? Array.from(value)
  : [];

const toTypes  = (value)   => Array.isArray(value) ? value.filter(Boolean) : String(value).split(/[\s,]+/).filter(Boolean);     
const withOnce = (options) => typeof options === 'boolean' ? { capture: options, once: true } : { ...options, once: true };

// :::::: EXPORTS

export const delegate = (root, selector, types, listener, options) => {
  const handler = (event) => {
    const match = event.target?.closest?.(selector);
    if (match && root.contains(match)) listener.call(match, event, match);
  };
  return onEvent(root, types, handler, options);
};

export const disposer = () => {
  const entries = new Set();
  return {
    add (unsubscribe) {
      if (typeof unsubscribe === 'function') entries.add(unsubscribe);
      return unsubscribe;
    },
    dispose () {
      for (const unsubscribe of entries) unsubscribe();
      entries.clear();
    },
    get size () { return entries.size; }
  };
};

export const emitEvent = (target, type, detail = {}, options) =>
  target.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail, ...options }));

export const offEvent = (targets, types, listener, options) => {
  const list  = toTargets(targets);
  const names = toTypes(types);
  for (const target of list) for (const type of names) target.removeEventListener(type, listener, options);
};

export const onEvent = (targets, types, listener, options) => {
  const list  = toTargets(targets);
  const names = toTypes(types);
  for (const target of list) for (const type of names) target.addEventListener(type, listener, options);
  return () => offEvent (targets, types, listener, options);
};

export const onceEvent = (targets, types, listener, options) => onEvent(targets, types, listener, withOnce(options));
