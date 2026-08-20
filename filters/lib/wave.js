// @aufbau/filters/lib/wave.js
import { filterTag, resolve } from '../core.js';

export const id   = 'wave';
export const name = 'Wave';
export const vars = {
  frequency : { type: 'number' , default: 0.02, min: 0, max: 0.2, step: 0.005 },
  octaves   : { type: 'integer', default: 2   , min: 1, max: 5  , step: 1     },
  scale     : { type: 'number' , default: 20  , min: 0, max: 100, step: 1     },
};

export default function wave (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="${v.octaves}" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.scale}" xChannelSelector="R" yChannelSelector="G"/>
  `, options);
}
