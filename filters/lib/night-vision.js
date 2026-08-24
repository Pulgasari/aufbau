// @aufbau/filters/lib/night-vision.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'night-vision';
export const name = 'Night Vision';
// luminance tinted green with animated film grain screened on top. { animate: false }
// freezes the grain. noise sets the grain alpha and bakes; speed bakes.
export const vars = {
  animate : { type: 'boolean', default: true },
  noise   : { type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, bake: true },
  speed   : { type: 'duration', default: '0.4s', bake: true },
};

export default function nightVision (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feColorMatrix type="matrix" values="0 0 0 0 0  0.3 0.6 0.1 0 0.05  0 0 0 0 0  0 0 0 1 0" result="tint"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="1" result="noise">
      ${anim(options, { attributeName: 'seed', values: '1;2;3;4;5', dur: v.speed, calcMode: 'discrete' })}
    </feTurbulence>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 ${v.noise} 0" result="grain"/>
    <feBlend mode="screen" in="grain" in2="tint"/>
  `, options);
}
