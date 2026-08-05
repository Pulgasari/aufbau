const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const toKeys = (path) => Array.isArray(path) ? path : String(path).split('.').filter(Boolean);

export const deepClone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export const deepMerge = (target, ...sources) => {
  for (const source of sources) {
    if (!isPlainObject(source)) continue;
    for (const key of Object.keys(source)) {
      const value   = source[key];
      const current = target[key];
      target[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
    }
  }
  return target;
};

export const getPath = (source, path, fallback) => {
  let current = source;
  for (const key of toKeys(path)) {
    if (current == null) return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
};

export const mapValues = (source, transform) => {
  const result = {};
  for (const [key, value] of Object.entries(source)) result[key] = transform(value, key);
  return result;
};

export const omit = (source, keys) => {
  const skipped = new Set(keys);
  const result  = {};
  for (const key of Object.keys(source)) if (!skipped.has(key)) result[key] = source[key];
  return result;
};

export const pick = (source, keys) => {
  const result = {};
  for (const key of keys) if (key in source) result[key] = source[key];
  return result;
};

export const setPath = (target, path, value) => {
  const keys = toKeys(path);
  const last = keys.pop();
  if (last === undefined) return target;

  let current = target;
  for (const key of keys) {
    if (!isPlainObject(current[key])) current[key] = {};
    current = current[key];
  }
  current[last] = value;
  return target;
};
