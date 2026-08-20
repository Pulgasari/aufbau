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
import * as pixelate         from './pixelate.js';
import * as polarPixelate    from './polar-pixelate.js';
import * as dither           from './dither.js';
import * as threshold        from './threshold.js';
import * as thermal          from './thermal.js';
import * as tiltShift        from './tilt-shift.js';
import * as vignette         from './vignette.js';
import * as wave             from './wave.js';
import * as wobble           from './wobble.js';

const modules = [
  badTv, barrelBlur, blur, brightness, contrast, dither, dotMatrix, duotone, edges,
  emboss, glitchHeavyCyber, glitchLive, glitchRgb, glow, grain, grayscale, halftone,
  hueSaturation, instacolor, invert, jitter, linocut, melt, nightVision, pixelate,
  polarPixelate, posterize, rainbow, rgbShift, saturate, scanlines, sepia, shake,
  sharpen, slices, smear, solarize, thermal, threshold, tiltShift, vignette, wave, wobble,
];

// each entry: { id, name, vars, render (svg), css, canvas }.
// - render : svg backend. the default export, UNLESS the module provides a `canvas`
//            backend (then its svg, if any, must come from a named `svg` export).
// - css    : native-css backend, or null.
// - canvas : imageData backend (mutates pixels in place), or null.
// webgl slots in here the same way later — see backends.md.
export const filters = Object.fromEntries(
  modules.map(m => [m.id, {
    id     : m.id,
    name   : m.name,
    vars   : m.vars,
    render : m.svg ?? (m.canvas ? null : m.default) ?? null,
    css    : m.css ?? null,
    canvas : m.canvas ?? null,
  }])
);
