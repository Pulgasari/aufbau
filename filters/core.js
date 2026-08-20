// @aufbau/filters/core.js
// shared string + dom helpers. no svg is fetched at runtime anymore: every filter
// is a function that builds its own markup, so these helpers just format values,
// wrap fragments and manage the one shared <defs> host. pure except for the dom
// helpers, which are only ever called from the browser api (never at import time),
// so this module stays safe to import in node for the generation script.

export const PREFIX  = '--aufbau-filter-';
export const HOST_ID = 'aufbau-filter-defs';

// element id for a filter, e.g. 'blur' -> 'aufbau-filter-blur'.
export const svgId = id => `aufbau-filter-${id}`;

// resolves every declared var to a value string. baked mode (default) yields the
// literal value; live mode yields `var(--aufbau-filter-<key>, <default>)` so css
// custom properties keep driving the primitives. a spec may set `bake: true` to
// force a literal even in live mode (for attributes that cannot read a css var).
export function resolve (vars, options = {}) {
  const live = options.live === true;
  const out  = {};
  for (const key in vars) {
    const spec  = vars[key];
    const baked = String(options[key] ?? spec.default);
    out[key] = live && !spec.bake ? `var(${PREFIX}${key}, ${spec.default})` : baked;
  }
  return out;
}

// wraps filter primitives in a <filter>. `options.svgId` overrides the element id,
// letting a caller mint a unique one; it defaults to aufbau-filter-<id>.
export function filterTag (id, body, options = {}) {
  return `<filter id="${options.svgId ?? svgId(id)}">${body.trim()}</filter>`;
}

// wraps a <filter> fragment in a zero-size <svg><defs> document — the standalone
// form written to disk as a .svg asset.
export function wrapSvg (fragment) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs>${fragment}</defs></svg>`;
}

// accepts a selector string, a single element, or a nodelist/array of elements.
export function toElements (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(el => el instanceof Element);
  return [];
}

// one shared, hidden <svg> host in <body> collects every injected <filter>.
export function defsHost () {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.id = HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(host);
  }
  return host;
}
