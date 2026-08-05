// @aufbau/utils/fp/match.js

import { identity } from './core.js';
import { test }     from './is.js';

// declarative replacement for if/else chains and switch statements.
// rules are plain [rule, handler] pairs, so they can be built, stored and extended as data.
// handlers may be functions or constant values, the first matching rule wins.
export const match = (rules, fallback = identity) => (value) => {
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (test(rule[0], value)) return typeof rule[1] === 'function' ? rule[1](value) : rule[1];
  }
  return typeof fallback === 'function' ? fallback(value) : fallback;
};

// :::::: CONDITIONAL TRANSFORMS

export const 
ifElse = (rule, onTrue, onFalse) => value => test(rule, value) ? onTrue(value) : onFalse(value),   
unless = (rule, fn)              => value => test(rule, value) ?        value  :      fn(value),
when   = (rule, fn)              => value => test(rule, value) ?     fn(value) :         value;
