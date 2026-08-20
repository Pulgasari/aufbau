// @aufbau/filters/lib/grain.js
import { filterTag, resolve } from '../core.js';

export const id   = 'grain';
export const name = 'Grain';
export const vars = {
  frequency : { type: 'number' , default: 0.8 , min: 0, max: 2, step: 0.05 },
  octaves   : { type: 'integer', default: 2   , min: 1, max: 5, step: 1    },
  opacity   : { type: 'number' , default: 0.15, min: 0, max: 1, step: 0.01 },
};

export default function grain (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="${v.frequency}" numOctaves="${v.octaves}" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="linear" slope="${v.opacity}"/>
    </feComponentTransfer>
    <feComposite operator="over" in2="SourceGraphic"/>
  `, options);
}
