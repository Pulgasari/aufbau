// @aufbau/filters/lib/instacolor.js
import { filterTag, resolve } from '../core.js';

export const id   = 'instacolor';
export const name = 'InstaColor';
// a warm cinematic grade: lift red/green, cool the blue, then a mild contrast s-curve.
// warmth and contrast both feed matrix/transfer constants, so both are baked.
export const vars = {
  warmth   : { type: 'number', default: 0.08, min: 0, max: 0.3, step: 0.01, bake: true },
  contrast : { type: 'number', default: 1.15, min: 0.5, max: 2, step: 0.05, bake: true },
};

export default function instacolor (options = {}) {
  const v = resolve(vars, options);
  const w = Number(v.warmth);
  const c = Number(v.contrast);
  const i = ((1 - c) / 2).toFixed(3); // intercept keeps mid-grey fixed
  return filterTag(id, `
    <feColorMatrix type="matrix" values="1 0 0 0 ${w}  0 1 0 0 ${(w * 0.4).toFixed(3)}  0 0 1 0 ${(-w).toFixed(3)}  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="${c}" intercept="${i}"/>
      <feFuncG type="linear" slope="${c}" intercept="${i}"/>
      <feFuncB type="linear" slope="${c}" intercept="${i}"/>
    </feComponentTransfer>
  `, options);
}
