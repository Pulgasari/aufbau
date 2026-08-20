// @aufbau/filters/lib/hue-saturation.js
import { filterTag, resolve } from '../core.js';

export const id   = 'hue-saturation';
export const name = 'Hue & Saturation';
export const vars = {
  hue        : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg' },
  saturation : { type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
};

export default function hueSaturation (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feColorMatrix type="hueRotate" values="${v.hue}"/>
    <feColorMatrix type="saturate" values="${v.saturation}"/>
  `, options);
}
