// @aufbau/filters/lib/glitch-live.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'glitch-live';
export const name = 'Live Glitch';
export const vars = {
  animate : { type: 'boolean', default: true },
  speed   : { type: 'time', default: '2s', bake: true },
};

// animated variant of glitch-rgb: the red and blue channels jitter horizontally on
// independent keyframe tracks, screened back over the static green channel. with
// { animate: false } the tracks drop and it rests as a clean channel split.
export default function glitchLive (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feOffset dx="0" dy="0" in="SourceGraphic" result="red-channel">
      ${anim(options, { attributeName: 'dx', values: '0; -8; 2; -10; 0; 5; -2; 0', keyTimes: '0; 0.05; 0.07; 0.1; 0.12; 0.2; 0.25; 1', dur: v.speed })}
    </feOffset>
    <feColorMatrix type="matrix" in="red-channel" result="red-isolated" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feOffset dx="0" dy="0" in="SourceGraphic" result="blue-channel">
      ${anim(options, { attributeName: 'dx', values: '0; 5; -3; 8; 0; -4; 0', keyTimes: '0; 0.03; 0.08; 0.12; 0.18; 0.22; 1', dur: v.speed })}
    </feOffset>
    <feColorMatrix type="matrix" in="blue-channel"  result="blue-isolated"  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
    <feColorMatrix type="matrix" in="SourceGraphic" result="green-isolated" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green"/>
    <feBlend mode="screen" in="red-green"    in2="blue-isolated"/>
  `, options);
}
