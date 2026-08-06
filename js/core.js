// @aufbau/js/core.js

// :::::: COMPOSITION

export const 
identity = value => value,
constant = value => () => value;

// left-to-right: pipe(f, g, h)(x) => h(g(f(x)))
// small arities are specialized to avoid a reducer closure per invocation
export const pipe = (...fns) => {
  const [first, second, third] = fns;
  switch (fns.length) {
    case 0: return identity;
    case 1: return first;
    case 2: return (value) => second(first(value));
    case 3: return (value) => third(second(first(value)));
  }
  return (value) => {
    for (let index = 0; index < fns.length; index++) value = fns[index](value);
    return value;
  };
};

// right-to-left: compose (f,g,h) (x) => f(g(h(x)))
export const compose = (...fns) => {
  const [first, second, third] = fns;
  switch (fns.length) {
    case 0: return identity;
    case 1: return first;
    case 2: return (value) => first(second(value));
    case 3: return (value) => first(second(third(value)));
  }
  return (value) => {
    for (let index = fns.length - 1; index >= 0; index--) value = fns[index](value);
    return value;
  };
};

// :::::: FUNCTION WRAPPERS

// step-by-step argument passing; pass arity explicitly when fn uses default or rest params,
// because fn.length stops counting at the first of those
export const curry = (fn, arity = fn.length) => {
  const curried = (...args) =>
    args.length >= arity ? fn(...args) : (...rest) => curried(...args, ...rest);
  return curried;
};

// runs a side effect and passes the value through unchanged (debug hook for pipelines)
export const tap = (fn) => (value) => { fn(value); return value; };

// invokes fn on the first call only, every later call replays the first result
export const once = (fn) => {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
};

// :::::: LOGIC COMBINATORS

export const not = (fn) => (...args) => !fn(...args);

// non-function arguments count as plain booleans and are folded in at construction time,
// so the per-call loop only ever touches real predicates
export const and = (...fns) => {
  const checks = fns.filter((fn) => typeof fn === 'function');
  if (fns.some((fn) => typeof fn !== 'function' && !fn)) return () => false;
  return (value) => {
    for (let index = 0; index < checks.length; index++) if (!checks[index](value)) return false;
    return true;
  };
};

export const or = (...fns) => {
  const checks = fns.filter((fn) => typeof fn === 'function');
  if (fns.some((fn) => typeof fn !== 'function' && fn)) return () => true;
  return (value) => {
    for (let index = 0; index < checks.length; index++) if (checks[index](value)) return true;
    return false;
  };
};
