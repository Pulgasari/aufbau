// look="swatch": a color. the swatch opens the native picker, the hex code can be typed next to it
// parts: box, swatch, input

import { html }                                  from '../../lib/html.js';
import { FRAME, field, fieldEvents, updateFields } from './parts/field.js';

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'single' && shape.type === 'color',

  css : `
    ${FRAME}
    [part~="box"] { padding-inline-start: 0.3em; }

    [part~="swatch"] {
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

    [part~="input"] { flex: 1 1 auto; font-variant-numeric: tabular-nums; inline-size: 7ch; }
  `,

  // both fields hold the same value, the picker and the text write into part 0
  render : host => html`
    <span part="swatch"><input type="color" data-index="0" aria-label="pick a color" /></span>
    ${field(host, 0, { spellcheck: 'false', type: 'text' })}
  `,

  events : fieldEvents,

  update (host) {
    updateFields(host);
    host.style.setProperty('--swatch', host.valueType.format(host.value));
  },

  focus : host => host.root.querySelector('[part~="input"]'),
};
