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
      min-block-size : --space(9);
      padding-inline : --space(normal);

      & + [part~="segment"] { border-inline-start: var(--input-line); }

      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render : host => optionButtons(host, 'segment'),
};
