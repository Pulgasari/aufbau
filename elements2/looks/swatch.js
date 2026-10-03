// @aufbau/elements2/looks/swatch.js
// a color: the swatch opens the native picker, the hex code can be typed next
// to it. parts: swatch, input

import { html }                         from '../core/html.js';
import { BOX, inputPart, syncInputs }   from './field.js';

export const swatch = {
  fits : shape => shape.kind === 'free' && shape.count === 'single' && shape.type === 'color',

  styles : `
    :host([look="swatch"]) [part~="box"] { ${BOX} padding-inline-start: 0.3em; }

    :host([look="swatch"]) [part~="box"]:focus-within { border-color: var(--color-ink, Highlight); }

    :host([look="swatch"]) [part~="swatch"] {
      background    : var(--swatch, transparent);
      block-size    : 1.6em;
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius : calc(var(--radius-control, 0.4em) * 0.75);
      flex          : none;
      inline-size   : 1.6em;
      overflow      : hidden;
      position      : relative;

      > input { cursor: pointer; inset: 0; opacity: 0; position: absolute; }
    }

    :host([look="swatch"]) [part~="input"]:not([type="color"]) {
      flex                 : 1 1 auto;
      font-variant-numeric : tabular-nums;
      inline-size          : 7ch;
    }
  `,

  // both fields hold the same value, the picker and the text write through one index
  render : host => html`
    <span part="swatch"><input type="color" data-index="0" aria-label="pick a color" /></span>
    ${inputPart(host, 0, { type: 'text', spellcheck: 'false' })}
  `,

  sync (host) {
    syncInputs(host);
    host.style.setProperty('--swatch', host.valueType.format(host.value));
  },

  focusTarget : host => host.root.querySelector('[part~="input"]'),
};
