import { groupEvents, optionButtons, updateSelected, updateTabStop } from './parts/options.js';

export default {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    [part~="box"] {
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius : var(--radius-control, 0.4em);
      gap           : 0;
      overflow      : hidden;
    }

    [part~="segment"] {
      flex           : 1 1 auto;
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.75em;

      & + [part~="segment"] { border-inline-start: var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent); }

      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render : host => optionButtons(host, 'segment'),
  events : groupEvents,
  update : host => updateTabStop(host, updateSelected(host)),
  role   : host => host.count === 'multiple' ? 'group' : 'radiogroup',
  focus  : host => host.root.querySelector('[data-value][tabindex="0"]'),
};
