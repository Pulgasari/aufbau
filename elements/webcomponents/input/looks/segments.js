import { GROUP, optionButtons } from './parts/options.js';

export default {
  ...GROUP,

  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    [part~="box"] {
      border        : var(--input-line);
      border-radius : --radius();
      gap           : 0;
      overflow      : hidden;
    }

    [part~="segment"] {
      flex           : 1 1 auto;
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.75em;

      & + [part~="segment"] { border-inline-start: var(--input-line); }

      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render : host => optionButtons(host, 'segment'),
};
