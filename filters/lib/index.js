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
import * as dotScreen        from './dot-screen.js';
import * as levels           from './levels.js';
import * as pixelSort        from './pixel-sort.js';
import * as threshold        from './threshold.js';
import * as fisheye          from './fisheye.js';
import * as kaleidoscope     from './kaleidoscope.js';
import * as mirror           from './mirror.js';
import * as zoomBlur         from './zoom-blur.js';
import * as gaussianBlur     from './gaussian-blur.js';
import * as bloom            from './bloom.js';
import * as chromatic        from './chromatic.js';
import * as noise            from './noise.js';
import * as displace         from './displace.js';
import * as glitch           from './glitch.js';
import * as thermal          from './thermal.js';
import * as tiltShift        from './tilt-shift.js';
import * as vignette         from './vignette.js';
import * as wave             from './wave.js';
import * as wobble           from './wobble.js';

const modules = [
  badTv, barrelBlur, bloom, blur, brightness, chromatic, contrast, displace, dither,
  dotMatrix, dotScreen, duotone, edges, emboss, fisheye, gaussianBlur, glitch,
  glitchHeavyCyber, glitchLive, glitchRgb, glow, grain, grayscale, halftone, hueSaturation,
  instacolor, invert, jitter, kaleidoscope, levels, linocut, melt, mirror, nightVision,
  noise, pixelate, pixelSort, polarPixelate, posterize, rainbow, rgbShift, saturate,
  scanlines, sepia, shake, sharpen, slices, smear, solarize, thermal, threshold, tiltShift,
  vignette, wave, wobble, zoomBlur,
];

// each entry: { id, name, vars, render (svg), css, canvas, webgl }.
// - render : svg backend. the default export, UNLESS the module provides a `canvas` or
//            `webgl` backend (then its svg, if any, must come from a named `svg` export).
// - css    : native-css backend, or null.
// - canvas : imageData backend (mutates pixels in place), or null.
// - webgl  : { fragment, uniforms } fragment-shader backend, or null.
export const filters = Object.fromEntries(
  modules.map(m => [m.id, {
    id     : m.id,
    name   : m.name,
    vars   : m.vars,
    render : m.svg ?? ((m.canvas || m.webgl) ? null : m.default) ?? null,
    css    : m.css ?? null,
    canvas : m.canvas ?? null,
    webgl  : m.webgl ?? null,
  }])
);
