// @aufbau/store/types.js
// the type registry. pure and engine-free: every entry is coerce + init plus
// method/read transforms written as value -> value functions. the carrier wires
// these onto a signal; keeping them pure makes all the real logic node-testable
// without a dom or a reactive engine.
//
// method fn signature: (value, spec, ...args) -> newValue   (mutating, via the carrier)
// read   fn signature: (value, spec, ...args) -> result     (non-mutating)

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const warn = msg => console.warn(`[@aufbau/store] ${msg}`);

const stripAccents = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
const toKebab = s => String(s)
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')   // split camelCase boundaries
  .replace(/[\s_]+/g, '-')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export const TYPES = {
  bool: {
    coerce  : x => Boolean(x),
    methods : { toggle: v => !v, on: () => true, off: () => false },
  },
  number: {
    coerce  : x => Number(x),
    methods : {
      clamp : (v, spec) => Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, v)),
      dec   : (v, spec, n = 1) => v - n,
      inc   : (v, spec, n = 1) => v + n,
      round : (v, spec, places = 0) => { const f = 10 ** places; return Math.round(v * f) / f; },
    },
  },
  string: {
    coerce  : x => (x == null ? '' : String(x)),
    methods : {
      toKebab : v => toKebab(v),
      toLower : v => String(v).toLowerCase(),
      toSlug  : v => toKebab(stripAccents(String(v))),
      toUpper : v => String(v).toUpperCase(),
      trim    : v => String(v).trim(),
    },
  },
  enum: {
    coerce  : (x, spec, current) => (spec.values.includes(x) ? x : (warn(`"${x}" not in [${spec.values}]`), current ?? spec.values[0])),
    methods : { cycle: (v, spec) => { const vs = spec.values, i = vs.indexOf(v); return vs[(i + 1) % vs.length]; } },
    reads   : { options: (v, spec) => spec.values.slice() },
  },
  list: {
    coerce  : (x, spec, current) => (Array.isArray(x) ? x : (current ?? [])),
    methods : {
      clear  : () => [],
      push   : (v, spec, x) => [...v, x],
      remove : (v, spec, x) => v.filter(y => y !== x),
      toggle : (v, spec, x) => (v.includes(x) ? v.filter(y => y !== x) : [...v, x]),
    },
    reads   : { has: (v, spec, x) => v.includes(x) },
  },
  ref: {
    coerce  : x => x,   // opaque, held by identity
  },
};

// bare literal in a schema -> its type. a plain-object spec is always config.
export function inferType (value) {
  switch (typeof value) {
    case 'boolean'  : return 'bool';
    case 'number'   : return 'number';
    case 'string'   : return 'string';
    case 'function' : return 'derived';
  }
  return Array.isArray(value) ? 'list' : 'ref';
}

// normalizes a schema entry to { type, init, spec }. a plain object is config
// (wrap a real object value in { value } to store it as a ref); anything else is
// a bare init value whose type is inferred.
export function describe (raw) {
  if (typeof raw === 'function') return { type: 'derived', init: undefined, spec: { get: raw } };
  if (!isPlainObject(raw))       return { type: inferType(raw), init: raw, spec: {} };

  const spec = raw;
  const type = spec.type ?? (spec.values ? 'enum' : spec.get ? 'derived' : inferType(spec.value));
  const init = type === 'enum' ? (spec.value ?? spec.values[0]) : spec.value;
  return { type, init, spec };
}

// verb names contributed by the types, so the store can reserve them
export const METHOD_VERBS = new Set();
export const READ_VERBS   = new Set();
for (const t of Object.values(TYPES)) {
  for (const name of Object.keys(t.methods ?? {})) METHOD_VERBS.add(name);
  for (const name of Object.keys(t.reads   ?? {})) READ_VERBS.add(name);
}
