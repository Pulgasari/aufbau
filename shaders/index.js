// @aufbau/shaders

import waveShader       from './presets/wave.js';
import heavyCyberGlitch from './presets/heavy_cyber_glitch.js';
import { glitchRgb }    from './presets/glitch.js';
import { liveGlitch }   from './presets/glitch.js';

/**
 * Registry mapping shader names to their respective SVG generator functions.
 */
export const presets = {
  'wave'               : waveShader,
  'wave-shader'        : waveShader,
  'glitch-rgb'         : glitchRgb,
  'live-glitch'        : liveGlitch,
  'heavy-cyber-glitch' : heavyCyberGlitch,
  'cyber-glitch'       : heavyCyberGlitch,
};

export {
  waveShader,
  glitchRgb,
  liveGlitch,
  heavyCyberGlitch
};
