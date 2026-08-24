// @aufbau/filters/lib/wobble.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'wobble';
export const name = 'Wobble';
export const vars = {
  animate   : { type: 'boolean', default: true },
  amount    : { type: 'number', default: 8, min: 0, max: 40, step: 1 },
  frequency : { type: 'number', default: 0.02, min: 0.005, max: 0.1, step: 0.005 },
  speed     : { type: 'duration', default: '3s', bake: true },
};

// a soft wavy warp; animating the turbulence frequency makes the whole thing wobble.
export default function wobble (options = {}) {
  const v = resolve(vars, options);
  const f = Number(options.frequency ?? vars.frequency.default);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="2" result="noise">
      ${anim(options, { attributeName: 'baseFrequency', values: `${f}; ${(f * 1.6).toFixed(4)}; ${f}`, dur: v.speed })}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.amount}" xChannelSelector="R" yChannelSelector="G"/>
  `, options);
}
