// @aufbau/api

import { deepMerge } from '@pulgasari/obj';
import { CSS_PATH, gestalt } from './gestalt.js';

// :::::: LAZY MODULE LOADERS ::::::::::::::::::::::::::::::::::
// Simple, explicit singletons using promise memoization

let _filters, _patterns, _webfonts, _elements, _config;

const
getConfig   = () => (_config   ??= import('@aufbau/element' )),
getElements = () => (_elements ??= import('@aufbau/elements')),
getFilters  = () => (_filters  ??= import('@aufbau/filters' )),
getPatterns = () => (_patterns ??= import('@aufbau/patterns')),
getWebfonts = () => (_webfonts ??= import('@aufbau/webfonts'));

export const // :::::: PURE / EXPLICIT DOM HELPERS :::::::::::::::::::::::::
domina = async (method, ...args) => {
  const mod = await import(`@domina/methods/${method}.js`);
  const fn = mod[method] ?? mod.default;
  return fn(...args);
};

export const // :::::: FILTER OPERATIONS (Explicit FP Functions) :::::::::::
applyFilter  = async (target, ...args) => (await getFilters()). apply(target, ...args),
removeFilter = async (target, ...args) => (await getFilters()).remove(target, ...args),
updateFilter = async (target, ...args) => (await getFilters()).update(target, ...args);

export const // :::::: PATTERN OPERATIONS :::::::::::::::::::::::::::::::::::
 applyPattern = async (target, ...args) => (await getPatterns()). apply(target, ...args),
removePattern = async (target, ...args) => (await getPatterns()).remove(target, ...args);       

export const // :::::: WEBFONT OPERATIONS :::::::::::::::::::::::::::::::::::
applyWebfont = async (target, ...args) => (await getWebfonts()).apply(target, ...args),
initWebfonts = async         (...args) => (await getWebfonts()).init         (...args);

// :::::: DISPATCHER / COMBINED FP :::::::::::::::::::::::::::::

const HANDLERS = {
  filter  : { apply: applyFilter,  remove: removeFilter },
  pattern : { apply: applyPattern, remove: removePattern },
  font    : { apply: applyWebfont, remove: async (t) => (await getWebfonts()).remove(t) },
};

const normalizeEntry = (value) => {
  if (typeof value === 'string') return [value, {}];
  if (Array.isArray(value)) return [value[0], value[1] ?? {}];
  const { id, ...options } = value;
  return [id, options];
};

export const apply = (target, spec = {}) =>
  Promise.all(
    Object.entries(spec).map(([kind, val]) => {
      const handler = HANDLERS[kind];
      if (!handler) throw new Error(`[@aufbau/api] Unknown kind "${kind}"`);
      return val == null
        ? handler.remove(target)
        : handler.apply(target, ...normalizeEntry(val));
    })
  );
