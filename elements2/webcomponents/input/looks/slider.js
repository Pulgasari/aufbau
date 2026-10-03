import { attrs, html } from '../../../lib/html.js';

const percent = (number, [min, max]) => ((number - min) / ((max - min) || 1)) * 100;

function positionsOf (host) {
  const [min, max] = host.bounds;
  return host.values.map((raw, index) => raw === ''
    ? (index === 1 ? max : min)
    : Math.min(max, Math.max(min, host.toNumber(raw))));
}

export default {
  fits : shape => shape.kind === 'free' && shape.axis && shape.count !== 'multiple',

  css : `
    :host {
      --slider-thumb : 1.1em;
      --slider-track : 0.35em;
    }

    [part~="track"] {
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

      &[part~="hue"]::before { background: linear-gradient(to right in hsl longer hue, red, red); }
    }

    [part~="fill"] {
      background         : var(--color-ink, AccentColor);
      block-size         : var(--slider-track);
      border-radius      : var(--slider-track);
      inline-size        : calc((var(--to) - var(--from)) * (100% - var(--slider-thumb)) / 100);
      inset-inline-start : calc(var(--slider-thumb) / 2 + var(--from) * (100% - var(--slider-thumb)) / 100);
      position           : absolute;
    }

    [part~="hue"] > [part~="fill"] { display: none; }

    [part~="thumb"] {
      background         : var(--slider-color, var(--color-fg, currentColor));
      block-size         : var(--slider-thumb);
      border             : 2px solid var(--color-ink, AccentColor);
      border-radius      : 50%;
      inline-size        : var(--slider-thumb);
      inset-inline-start : calc(var(--at) * (100% - var(--slider-thumb)) / 100);
      pointer-events     : none;
      position           : absolute;

      &:has(+ input:focus-visible) { outline: 2px solid var(--color-ink, Highlight); outline-offset: 2px; }
    }

    [part~="input"] {
      appearance  : none;
      block-size  : 100%;
      cursor      : pointer;
      inline-size : 100%;
      inset       : 0;
      opacity     : 0;
      position    : absolute;

      &::-webkit-slider-thumb { appearance: none; block-size: var(--slider-thumb); inline-size: var(--slider-thumb); }
      &::-moz-range-thumb     { block-size: var(--slider-thumb); border: 0; inline-size: var(--slider-thumb); }
    }

    :host([range]) [part~="input"] {
      pointer-events: none;

      &::-webkit-slider-thumb { pointer-events: auto; }
      &::-moz-range-thumb     { pointer-events: auto; }
    }

    [part~="output"] { flex: none; font-variant-numeric: tabular-nums; min-inline-size: 4ch; text-align: end; }
  `,

  render (host) {
    const range      = host.count === 'range';
    const [min, max] = host.bounds;
    const step       = host.stepSize;
    const unit       = host.getAttr('unit');

    const handle = index => html`
      <span part="thumb" data-thumb="${index}"></span>
      <input type="range" part="input" data-index="${index}" ${attrs({ 'aria-label': range && (index ? 'to' : 'from'), max, min, step })} />
    `;

    return html`
      <span part="${host.typeName === 'color' ? 'track hue' : 'track'}">
        <span part="fill"></span>
        ${handle(0)}
        ${range && handle(1)}
      </span>
      ${host.getAttr('readout') && html`<output part="output"></output>`}
      ${unit && html`<small part="unit">${unit}</small>`}
    `;
  },

  events (host, scope) {
    scope.on('input', 'input[type="range"]', (event, input) => host.setNumber(Number(input.dataset.index), Number(input.value), { track: true }));
  },

  update (host) {
    const bounds    = host.bounds;
    const positions = positionsOf(host);
    const parts     = host.values;
    const range     = host.count === 'range';

    for (const input of host.root.querySelectorAll('input[type="range"]')) {
      input.disabled = host.isLocked;
      if (input !== host.focused) input.value = String(positions[Number(input.dataset.index)]);
    }

    for (const thumb of host.root.querySelectorAll('[data-thumb]')) {
      thumb.style.setProperty('--at', percent(positions[Number(thumb.dataset.thumb)], bounds));
    }

    const track = host.part('track').node;
    track.style.setProperty('--from', range ? percent(positions[0], bounds) : 0);
    track.style.setProperty('--to',   percent(positions[range ? 1 : 0], bounds));

    const shown  = positions.map((position, index) => parts[index] || host.fromNumber(position));
    const output = host.part('output').node;
    if (output) output.textContent = range ? shown.join(' – ') : shown[0];

    host.setVar('--slider-color', host.typeName === 'color' && shown[0]);
  },

  focus : host => host.root.querySelector('input[type="range"]'),
};
