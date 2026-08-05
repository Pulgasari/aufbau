// ============================================================================
// 1. PIPE & COMPOSE CORE
// ============================================================================

// Executes functions left-to-right: pipe(f, g, h)(x) => h(g(f(x)))
export const pipe = (...fns) => (initialValue) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

// Executes functions right-to-left: compose(f, g, h)(x) => f(g(h(x)))
export const compose = (...fns) => (initialValue) =>
  fns.reduceRight((acc, fn) => fn(acc), initialValue);

// ============================================================================
// 2. CURRIED FP UTILITIES (Reusable Pipeline Building Blocks)
// ============================================================================

// Curried array transformers
export const map    = fn => arr => arr.map(fn);
export const filter = predicate => arr => arr.filter(predicate);
export const reduce = (fn, init) => arr => arr.reduce(fn, init);

// Curried string transformers
export const trim    = str => str.trim();
export const toLower = str => str.toLowerCase();
export const toUpper = str => str.toUpperCase();
export const split   = char => str => str.split(char);
export const join    = char => arr => arr.join(char);

// Curried object getters
export const prop    = key => obj => obj?.[key];
