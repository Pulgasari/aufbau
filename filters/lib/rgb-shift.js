// @aufbau/filters/lib/rgb-shift.js
import { filterTag, resolve } from '../core.js';

export const id   = 'rgb-shift';
export const name = 'RGB Shift';
// static chromatic aberration: red and blue split along `angle` by `amount` px. dx/dy
// are filter-primitive attributes (no css var), and derive from angle, so both bake.
export const vars = {
  amount : { type: 'number', default: 4, min: 0, max: 30, step: 1, bake: true },
  angle  : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
};

export default function rgbShift (options = {}) {
  const v   = resolve(vars, options);
  const rad = Number(v.angle) * Math.PI / 180;
  const dx  = Number(v.amount) * Math.cos(rad);
  const dy  = Number(v.amount) * Math.sin(rad);
  return filterTag(id, `
    <feOffset dx="${dx.toFixed(2)}" dy="${dy.toFixed(2)}" in="SourceGraphic" result="red-channel"/>
    <feColorMatrix type="matrix" in="red-channel" result="red-isolated" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feOffset dx="${(-dx).toFixed(2)}" dy="${(-dy).toFixed(2)}" in="SourceGraphic" result="blue-channel"/>
    <feColorMatrix type="matrix" in="blue-channel"  result="blue-isolated"  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
    <feColorMatrix type="matrix" in="SourceGraphic" result="green-isolated" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green"/>
    <feBlend mode="screen" in="red-green"    in2="blue-isolated"/>
  `, options);
}
