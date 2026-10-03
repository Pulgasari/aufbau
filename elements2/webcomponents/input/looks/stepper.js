import { html }                                                from '../../../lib/html.js';
import { FRAME, field, fieldEvents, firstField, updateFields } from './parts/field.js';

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'single' && shape.steppable,

  css : `
    ${FRAME}
    [part~="box"] { padding-inline: 0.25em; }

    [part~="input"] {
      appearance  : textfield;
      flex        : 1 1 auto;
      inline-size : 100%;
      text-align  : center;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button { appearance: none; margin: 0; }
    }

    [part~="button"] {
      block-size    : 1.75em;
      border-radius : var(--radius-control, 0.4em);
      inline-size   : 1.75em;

      &:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
    }
  `,

  render : host => html`
    <button type="button" part="button decrement" data-step="-1" aria-label="less" tabindex="-1"><svg-icon icon="lucide:minus"></svg-icon></button>
    ${field(host)}
    <button type="button" part="button increment" data-step="1" aria-label="more" tabindex="-1"><svg-icon icon="lucide:plus"></svg-icon></button>
  `,

  events (host, on) {
    fieldEvents(host, on);
    on('click', '[data-step]', (event, button) => host.step(Number(button.dataset.step)));
    on(host.root, 'keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      host.step(event.key === 'ArrowUp' ? 1 : -1);
    });
  },

  update : updateFields,
  focus  : firstField,
};
