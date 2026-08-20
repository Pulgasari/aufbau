// @aufbau/filters/lib/index.js
// registry of every filter module. pure string builders with no dom access, so it
// is safe to import in node (the generation script) and in the browser (the api).
// each entry: { id, name, vars, render } where render(options) -> <filter> markup.

import * as blur             from './blur.js';
import * as glitchHeavyCyber from './glitch-heavy-cyber.js';
import * as glitchLive       from './glitch-live.js';
import * as glitchRgb        from './glitch-rgb.js';
import * as grain            from './grain.js';
import * as wave             from './wave.js';

const modules = [blur, glitchHeavyCyber, glitchLive, glitchRgb, grain, wave];

export const filters = Object.fromEntries(
  modules.map(m => [m.id, { id: m.id, name: m.name, vars: m.vars, render: m.default }])
);
