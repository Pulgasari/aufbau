// @aufbau/filters/lib/index.js
// registry of every filter module. pure string builders with no dom access, so it
// is safe to import in node (the generation script) and in the browser (the api).
// each entry: { id, name, vars, render } where render(options) -> <filter> markup.

import * as badTv            from './bad-tv.js';
import * as barrelBlur       from './barrel-blur.js';
import * as blur             from './blur.js';
import * as brightness       from './brightness.js';
import * as contrast         from './contrast.js';
import * as dotMatrix        from './dot-matrix.js';
import * as duotone          from './duotone.js';
import * as edges            from './edges.js';
import * as emboss           from './emboss.js';
import * as glitchHeavyCyber from './glitch-heavy-cyber.js';
import * as glitchLive       from './glitch-live.js';
import * as glitchRgb        from './glitch-rgb.js';
import * as glow             from './glow.js';
import * as grain            from './grain.js';
import * as grayscale        from './grayscale.js';
import * as halftone         from './halftone.js';
import * as hueSaturation    from './hue-saturation.js';
import * as instacolor       from './instacolor.js';
import * as invert           from './invert.js';
import * as jitter           from './jitter.js';
import * as linocut          from './linocut.js';
import * as melt             from './melt.js';
import * as nightVision      from './night-vision.js';
import * as posterize        from './posterize.js';
import * as rainbow          from './rainbow.js';
import * as rgbShift         from './rgb-shift.js';
import * as saturate         from './saturate.js';
import * as scanlines        from './scanlines.js';
import * as sepia            from './sepia.js';
import * as shake            from './shake.js';
import * as sharpen          from './sharpen.js';
import * as slices           from './slices.js';
import * as smear            from './smear.js';
import * as solarize         from './solarize.js';
import * as thermal          from './thermal.js';
import * as tiltShift        from './tilt-shift.js';
import * as vignette         from './vignette.js';
import * as wave             from './wave.js';
import * as wobble           from './wobble.js';

const modules = [
  badTv, barrelBlur, blur, brightness, contrast, dotMatrix, duotone, edges, emboss,
  glitchHeavyCyber, glitchLive, glitchRgb, glow, grain, grayscale, halftone,
  hueSaturation, instacolor, invert, jitter, linocut, melt, nightVision, posterize,
  rainbow, rgbShift, saturate, scanlines, sepia, shake, sharpen, slices, smear,
  solarize, thermal, tiltShift, vignette, wave, wobble,
];

// each entry: { id, name, vars, render (svg), css }. render is the svg backend (the
// default export); css is the optional native-css backend (null when unsupported).
// canvas/webgl backends will slot in here the same way — see backends.md.
export const filters = Object.fromEntries(
  modules.map(m => [m.id, { id: m.id, name: m.name, vars: m.vars, render: m.default, css: m.css ?? null }])
);
