import { html }                                    from '../../../lib/html.js';
import { FRAME, field, fieldEvents, updateFields } from './parts/field.js';

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'single' && shape.type === 'color',

  css : `
    ${FRAME}
    [part~="box"] { padding-inline-start: 0.3em; }

    [part~="swatch"] {
      background    : var(--swatch, transparent);
      block-size    : 1.6em;
      border        : var(--input-line);
      border-radius : calc(var(--radius-control, 0.4em) * 0.75);
      flex          : none;
      inline-size   : 1.6em;
      overflow      : hidden;
      position      : relative;

      > input { cursor: pointer; inset: 0; opacity: 0; position: absolute; }
    }

    [part~="input"] { flex: 1 1 auto; font-variant-numeric: tabular-nums; inline-size: 7ch; }
  `,

  render : host => html`
    <span part="swatch"><input type="color" data-index="0" aria-label="pick a color" /></span>
    ${field(host, 0, { spellcheck: 'false', type: 'text' })}
  `,

  events : fieldEvents,

  update (host) {
    updateFields(host);
    host.setVar('--swatch', host.valueType.format(host.value));
  },

  focus : host => host.part('input').node,
};
