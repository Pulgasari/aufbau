// @aufbau/filters/lib/bad-tv.js
import { anim, dataUri, filterTag, resolve } from '../core.js';

export const id   = 'bad-tv';
export const name = 'Bad TV';
// the showcase combo: animated horizontal warp, an rgb channel split, and rolling
// scanlines on top. distortion stays live (displacement scale); speed/scanline look
// bake. with { animate: false } the warp and roll freeze into a static bad signal.
export const vars = {
  animate    : { type: 'boolean', default: true },
  distortion : { type: 'number', default: 8, min: 0, max: 40, step: 1 },
  speed      : { type: 'time', default: '2s', bake: true },
};

export default function badTv (options = {}) {
  const v    = resolve(vars, options);
  const tile = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="4" height="3">
      <rect width="4" height="1" fill="#000000" fill-opacity="0.35"/>
    </svg>
  `);
  return filterTag(id, `
    <feTurbulence type="fractalNoise" baseFrequency="0 0.0008" numOctaves="1" seed="3" result="noise">
      ${anim(options, { attributeName: 'seed', values: '3;7;11;15', dur: v.speed, calcMode: 'discrete' })}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${v.distortion}" xChannelSelector="R" yChannelSelector="A" result="warp"/>
    <feOffset in="warp" dx="1.5" dy="0" result="r0"/>
    <feColorMatrix in="r0" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="ri"/>
    <feOffset in="warp" dx="-1.5" dy="0" result="b0"/>
    <feColorMatrix in="b0"   type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bi"/>
    <feColorMatrix in="warp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gi"/>
    <feBlend mode="screen" in="ri" in2="gi" result="rg"/>
    <feBlend mode="screen" in="rg" in2="bi" result="rgb"/>
    <feImage href="${tile}" x="0" y="0" width="4" height="3" result="tile"/>
    <feTile in="tile" result="lines"/>
    <feComposite in="lines" in2="rgb" operator="over"/>
  `, options);
}
