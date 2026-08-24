// @aufbau/filters/lib/slices.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'slices';
export const name = 'Slices';
// horizontal bands shift sideways: a turbulence with near-zero x-frequency and a
// count-driven y-frequency feeds an x-only displacement. approximation of a proper
// slice glitch, but reads convincingly. `count` bakes (it sets baseFrequency).
export const vars = {
  animate : { type: 'boolean', default: false },
  amount  : { type: 'number', default: 20, min: 0, max: 80, step: 1 },
  count   : { type: 'number', default: 8, min: 2, max: 40, step: 1, bake: true },
  speed   : { type: 'duration', default: '0.5s', bake: true },
};

export default function slices (options = {}) {
  const v     = resolve(vars, options);
  const freqY = (Number(options.count ?? vars.count.default) * 0.012).toFixed(4);
  return filterTag(id, `
    <feTurbulence type="turbulence" baseFrequency="0.00001 ${freqY}" numOctaves="1" seed="2" result="noise">
      ${anim(options, { attributeName: 'seed', values: '0;4;8;12', dur: v.speed, calcMode: 'discrete' })}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.amount}" xChannelSelector="R" yChannelSelector="A"/>
  `, options);
}
