// @aufbau/patterns/lib/dots.js
import { patternTag, resolve } from '../core.js';

export const id   = 'dots';
export const name = 'Dots';
// bg/fg feed `fill`, a css property, so they stay live; geometry (size, radius,
// rotate) lands in plain attributes that cannot read a css var, so it is baked.
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  radius : { type: 'number', default: 3 , min: 0, max: 10 , step: 0.5, bake: true },
  rotate : { type: 'angle' , default: 0 , min: 0, max: 360, step: 1  , unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1  , bake: true },
};

export default function dots (options = {}) {
  const v = resolve(vars, options);
  const c = Number(v.size) / 2;
  return patternTag(id, v.size, `
    <rect width="${v.size}" height="${v.size}" fill="${v.bg}"/>
    <circle cx="${c}" cy="${c}" r="${v.radius}" fill="${v.fg}"/>
  `, v.rotate, options);
}
