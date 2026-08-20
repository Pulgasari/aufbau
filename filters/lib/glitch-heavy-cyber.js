// @aufbau/filters/lib/glitch-heavy-cyber.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'glitch-heavy-cyber';
export const name = 'Heavy Cyber Glitch';
export const vars = {
  animate   : { type: 'boolean', default: true },
  frequency : { type: 'text'  , default: '0.0 0.95', bake: true },
  scale     : { type: 'number', default: 40, min: 0, max: 120, step: 5, bake: true },
  speed     : { type: 'time'  , default: '1.5s', bake: true },
};

// stacks an animated turbulence displacement under an rgb channel split for a heavy,
// self-animating cyber glitch. peakScale is derived from scale at build time; with
// { animate: false } it rests as a static displaced channel split.
export default function glitchHeavyCyber (options = {}) {
  const v         = resolve(vars, options);
  const peakScale = Math.round(Number(v.scale) * 1.75);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="1" result="noise">
      ${anim(options, { attributeName: 'baseFrequency', values: '0.0 0.95; 0.0 0.1; 0.0 0.8; 0.0 0.95', dur: '0.4s' })}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="displaced">
      ${anim(options, { attributeName: 'scale', values: `0; ${v.scale}; 0; 0; ${peakScale}; 0; 10; 0`, keyTimes: '0; 0.05; 0.08; 0.4; 0.43; 0.46; 0.8; 1', dur: v.speed })}
    </feDisplacementMap>
    <feOffset dx="0" dy="0" in="displaced" result="red-channel">
      ${anim(options, { attributeName: 'dx', values: '0; -15; 0; 10; 0', keyTimes: '0; 0.05; 0.1; 0.43; 1', dur: v.speed })}
    </feOffset>
    <feColorMatrix type="matrix" in="red-channel" result="red-isolated" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feOffset dx="0" dy="0" in="displaced" result="blue-channel">
      ${anim(options, { attributeName: 'dx', values: '0; 15; 0; -10; 0', keyTimes: '0; 0.03; 0.08; 0.45; 1', dur: v.speed })}
    </feOffset>
    <feColorMatrix type="matrix" in="blue-channel" result="blue-isolated" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
    <feColorMatrix type="matrix" in="displaced"    result="green-isolated" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green"/>
    <feBlend mode="screen" in="red-green"    in2="blue-isolated"/>
  `, options);
}
