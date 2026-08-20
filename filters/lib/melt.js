// @aufbau/filters/lib/melt.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'melt';
export const name = 'Melt';
export const vars = {
  animate : { type: 'boolean', default: true },
  amount  : { type: 'number', default: 15, min: 0, max: 60, step: 1 },
  speed   : { type: 'time', default: '4s', bake: true },
};

// vertically biased displacement (x reads the flat alpha channel, y the noise), so
// the source drips downward. animating the scale makes it ooze and settle.
export default function melt (options = {}) {
  const v = resolve(vars, options);
  const a = Number(options.amount ?? vars.amount.default);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.05" numOctaves="2" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.amount}" xChannelSelector="A" yChannelSelector="G">
      ${anim(options, { attributeName: 'scale', values: `0; ${a}; 0`, dur: v.speed })}
    </feDisplacementMap>
  `, options);
}
