// @aufbau/ass
// aufbau style sheets: a small css superset. this entry is environment-agnostic
// (string in, css string out), so the same code runs in a build step and in a
// browser worker. dom/runtime helpers live in run.js.

import { parse }     from './parse.js';
import { serialize } from './serialize.js';
import { transform } from './transform.js';

export function compile (source, options = {}) {
  return serialize(transform(parse(source)), options);
}

export { parse, serialize, transform };
export default compile;
