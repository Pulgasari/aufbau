// @aufbau/filters/lib/shake.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'shake';
export const name = 'Shake';
// amount only feeds the (numeric) animation tracks; the static base is dx=dy=0, so
// with { animate: false } the source simply sits still.
export const vars = {
  animate : { type: 'boolean', default: true },
  amount  : { type: 'number', default: 5, min: 0, max: 40, step: 1, bake: true },
  speed   : { type: 'time', default: '0.4s', bake: true },
};

export default function shake (options = {}) {
  const v = resolve(vars, options);
  const a = Number(options.amount ?? vars.amount.default);
  return filterTag(id, `
    <feOffset dx="0" dy="0" in="SourceGraphic">
      ${anim(options, { attributeName: 'dx', values: `0; ${a}; -${a}; ${(a / 2).toFixed(1)}; 0`, dur: v.speed })}
      ${anim(options, { attributeName: 'dy', values: `0; -${a}; ${a}; 0`, dur: v.speed })}
    </feOffset>
  `, options);
}
