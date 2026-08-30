// @aufbau/patterns/lib/index.js
// registry of every pattern module. pure string builders with no dom access, so it
// is safe to import in node (the generation script) and in the browser (the api).
// each entry: { id, name, vars, render } where render(options) -> full <svg> tile.

import * as bricks     from './bricks.js';
import * as checks     from './checks.js';
import * as chevron    from './chevron.js';
import * as crosses    from './crosses.js';
import * as crosshatch from './crosshatch.js';
import * as diagonal   from './diagonal.js';
import * as diamonds   from './diamonds.js';
import * as dots       from './dots.js';
import * as grid       from './grid.js';
import * as rings      from './rings.js';
import * as squares    from './squares.js';
import * as stripes    from './stripes.js';
import * as triangles  from './triangles.js';
import * as waves      from './waves.js';

const modules = [
  bricks, checks, chevron, crosses, crosshatch, diagonal, diamonds, dots,
  grid, rings, squares, stripes, triangles, waves,
];

export const patterns = Object.fromEntries(
  modules.map(m => [m.id, { id: m.id, name: m.name, vars: m.vars, render: m.default }])
);
