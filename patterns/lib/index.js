// @aufbau/patterns/lib/index.js
// registry of every pattern module. pure string builders with no dom access, so it
// is safe to import in node (the generation script) and in the browser (the api).
// each entry: { id, name, vars, render } where render(options) -> full <svg> tile.

import * as dots    from './dots.js';
import * as grid    from './grid.js';
import * as stripes from './stripes.js';

const modules = [dots, grid, stripes];

export const patterns = Object.fromEntries(
  modules.map(m => [m.id, { id: m.id, name: m.name, vars: m.vars, render: m.default }])
);
