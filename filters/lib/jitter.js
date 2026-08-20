// @aufbau/filters/lib/jitter.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'jitter';
export const name = 'Jitter';
export const vars = {
  animate   : { type: 'boolean', default: true },
  amount    : { type: 'number', default: 5, min: 0, max: 40, step: 1 },
  frequency : { type: 'number', default: 0.5, min: 0.05, max: 2, step: 0.05 },
  speed     : { type: 'time', default: '0.6s', bake: true },
};

// jumps the source around on a discrete turbulence seed for a nervous, jittery feel.
export default function jitter (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feTurbulence type="turbulence" baseFrequency="${v.frequency}" numOctaves="1" seed="1" result="noise">
      ${anim(options, { attributeName: 'seed', values: '1;3;5;7;9;11;13;15', dur: v.speed, calcMode: 'discrete' })}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.amount}" xChannelSelector="R" yChannelSelector="G"/>
  `, options);
}
