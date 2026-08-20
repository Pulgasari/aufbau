// @aufbau/filters/lib/glitch-rgb.js
import { filterTag, resolve } from '../core.js';

export const id   = 'glitch-rgb';
export const name = 'RGB Glitch';
// dx/dy are filter-primitive attributes, not css properties, so they cannot read
// a custom property; `bake` keeps them literal even in live mode (also lets the
// blue channel use -offset without emitting a malformed `-var(...)`).
export const vars = {
  offsetX : { type: 'number', default: 3, min: -20, max: 20, step: 1, bake: true },
  offsetY : { type: 'number', default: 0, min: -20, max: 20, step: 1, bake: true },
};

// splits the source into isolated red/blue channels, offsets them in opposite
// directions and screens them back over the untouched green channel.
export default function glitchRgb (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feOffset dx="${v.offsetX}" dy="${v.offsetY}" in="SourceGraphic" result="red-channel"/>
    <feColorMatrix type="matrix" in="red-channel" result="red-isolated" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feOffset dx="-${v.offsetX}" dy="-${v.offsetY}" in="SourceGraphic" result="blue-channel"/>
    <feColorMatrix type="matrix" in="blue-channel"  result="blue-isolated"  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
    <feColorMatrix type="matrix" in="SourceGraphic" result="green-isolated" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green"/>
    <feBlend mode="screen" in="red-green"    in2="blue-isolated"/>
  `, options);
}
