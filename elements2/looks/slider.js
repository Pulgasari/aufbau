// @aufbau/elements2/looks/slider.js
// a value on an axis, two with `range`. every axis type (number, date, time,
// color, …) is projected onto one numeric track through its value type.
// parts: track, fill, thumb, input, output
//
// the track, the fill and the thumbs are drawn, transparent native range inputs
// lie on top of them: keyboard, touch and the accessible slider stay native,
// and the thumb can be a part, which the pseudo element of a native thumb cannot.

import { attrs, html } from '../core/html.js';

const percent = (number, [min, max]) => ((number - min) / ((max - min) || 1)) * 100;

/** the track positions of the values, an empty end falls back to its bound */
function numbersOf (host) {
  const bounds = host.bounds;
  return host.values.map((raw, index) => raw === ''
    ? bounds[index === 1 ? 1 : 0]
    : Math.min(bounds[1], Math.max(bounds[0], host.toNumber(raw))));
}

export const slider = {
  fits : shape => shape.kind === 'free' && shape.axis && shape.count !== 'multiple',

  styles : `
    :host([look="slider"]) {
      --slider-thumb : 1.1em;
      --slider-track : 0.35em;
    }

    :host([look="slider"]) [part~="track"] {
      align-items     : center;
      block-size      : var(--slider-thumb);
      display         : flex;
      flex            : 1 1 auto;
      min-inline-size : var(--slider-size, 10em);
      position        : relative;

      &::before {
        background    : color-mix(in srgb, currentColor 20%, transparent);
        block-size    : var(--slider-track);
        border-radius : var(--slider-track);
        content       : '';
        inset-inline  : 0;
        position      : absolute;
      }

      &[part~="hue"]::before {
        background: linear-gradient(to right in hsl longer hue, red, red);
      }
    }

    /* positions run from half a thumb to the other half, like the native thumb they cover */
    :host([look="slider"]) [part~="fill"] {
      background         : var(--color-ink, AccentColor);
      block-size         : var(--slider-track);
      border-radius      : var(--slider-track);
      inline-size        : calc((var(--to) - var(--from)) * (100% - var(--slider-thumb)) / 100);
      inset-inline-start : calc(var(--slider-thumb) / 2 + var(--from) * (100% - var(--slider-thumb)) / 100);
      position           : absolute;
    }

    :host([look="slider"]) [part~="track"][part~="hue"] [part~="fill"] { display: none; }

    :host([look="slider"]) [part~="thumb"] {
      background         : var(--slider-color, var(--color-fg, currentColor));
      block-size         : var(--slider-thumb);
      border             : 2px solid var(--color-ink, AccentColor);
      border-radius      : 50%;
      inline-size        : var(--slider-thumb);
      inset-inline-start : calc(var(--at) * (100% - var(--slider-thumb)) / 100);
      pointer-events     : none;
      position           : absolute;
    }

    :host([look="slider"]) [part~="input"] {
      appearance  : none;
      block-size  : 100%;
      cursor      : pointer;
      inline-size : 100%;
      inset       : 0;
      margin      : 0;
      opacity     : 0;
      position    : absolute;

      &::-webkit-slider-thumb { appearance: none; block-size: var(--slider-thumb); inline-size: var(--slider-thumb); }
      &::-moz-range-thumb     { block-size: var(--slider-thumb); border: 0; inline-size: var(--slider-thumb); }
    }

    /* two inputs on one track: only their thumbs take the pointer, so both stay reachable */
    :host([look="slider"][range]) [part~="input"] {
      pointer-events: none;

      &::-webkit-slider-thumb { pointer-events: auto; }
      &::-moz-range-thumb     { pointer-events: auto; }
    }

    :host([look="slider"]) [part~="thumb"]:has(+ [part~="input"]:focus-visible) {
      outline        : 2px solid var(--color-ink, Highlight);
      outline-offset : 2px;
    }

    :host([look="slider"]) [part~="output"] {
      flex                 : none;
      font-variant-numeric : tabular-nums;
      min-inline-size      : 4ch;
      text-align           : end;
    }
  `,

  render (host) {
    const range  = host.count === 'range';
    const [min, max] = host.bounds;
    const step   = host.stepSize;
    const color  = host.typeName === 'color';
    const unit   = host.getAttr('unit');

    const handle = index => html`
      <span part="thumb" data-thumb="${index}"></span>
      <input type="range" part="input" data-axis="${index}" ${attrs({ 'aria-label': range && (index ? 'to' : 'from'), max, min, step })} />
    `;

    return html`
      <span part="${color ? 'track hue' : 'track'}">
        <span part="fill"></span>
        ${handle(0)}
        ${range && handle(1)}
      </span>
      ${host.getAttr('readout') && html`<output part="output"></output>`}
      ${unit && html`<small part="unit">${unit}</small>`}
    `;
  },

  sync (host) {
    const bounds  = host.bounds;
    const numbers = numbersOf(host);
    const values  = host.values;
    const range   = host.count === 'range';

    for (const input of host.root.querySelectorAll('input[data-axis]')) {
      input.disabled = host.isLocked;
      if (input === host.focused) continue;
      input.value = String(numbers[Number(input.dataset.axis)]);
    }

    for (const thumb of host.root.querySelectorAll('[data-thumb]')) {
      thumb.style.setProperty('--at', percent(numbers[Number(thumb.dataset.thumb)], bounds));
    }

    const track = host.root.querySelector('[part~="track"]');
    track?.style.setProperty('--from', range ? percent(numbers[0], bounds) : 0);
    track?.style.setProperty('--to',   percent(numbers[range ? 1 : 0], bounds));

    const shown  = numbers.map((number, index) => values[index] || host.fromNumber(number));
    const output = host.root.querySelector('[part~="output"]');
    if (output) output.textContent = range ? shown.join(' – ') : shown[0];

    if (host.typeName === 'color') host.style.setProperty('--slider-color', shown[0]);
    else host.style.removeProperty('--slider-color');
  },

  focusTarget : host => host.root.querySelector('input[data-axis]'),
};
