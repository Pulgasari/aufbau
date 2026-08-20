// @aufbau/filters/lib/scanlines.js
import { anim, dataUri, filterTag, resolve } from '../core.js';

export const id   = 'scanlines';
export const name = 'Scanlines';
// lays translucent horizontal lines over the source via a tiled feImage. with
// { animate: true } the lines roll downward. gap/thickness/opacity bake into the tile.
export const vars = {
  animate   : { type: 'boolean', default: false },
  gap       : { type: 'number', default: 4, min: 2, max: 20, step: 1, bake: true },
  thickness : { type: 'number', default: 1, min: 0.5, max: 6, step: 0.5, bake: true },
  opacity   : { type: 'number', default: 0.35, min: 0, max: 1, step: 0.05, bake: true },
  speed     : { type: 'time', default: '4s', bake: true },
};

export default function scanlines (options = {}) {
  const v    = resolve(vars, options);
  const tile = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="4" height="${v.gap}">
      <rect width="4" height="${v.thickness}" fill="#000000" fill-opacity="${v.opacity}"/>
    </svg>
  `);
  return filterTag(id, `
    <feImage href="${tile}" x="0" y="0" width="4" height="${v.gap}" result="tile"/>
    <feTile in="tile" result="lines"/>
    <feOffset in="lines" dx="0" dy="0" result="rolled">
      ${anim(options, { attributeName: 'dy', values: `0; ${v.gap}`, dur: v.speed })}
    </feOffset>
    <feComposite in="rolled" in2="SourceGraphic" operator="over"/>
  `, options);
}
