// @aufbau/ass
// aufbau style sheets: a small css superset. this entry is environment-agnostic
// (string in, css string out), so the same code runs in a build step and in a
// browser worker. dom/runtime helpers live in run.js.

import { parse }     from './parse.js';
import { serialize } from './serialize.js';
import { transform } from './transform.js';

function compile (code, options = {}) {
  code = parse     (code);
  code = transform (code);
  code = serialize (code, options);
  return code;
}

export { compile, parse, serialize, transform };
export { ass, createASS } from './tag.js';
export default compile;
