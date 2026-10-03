import { control, controlOf, events, fits, update } from './parts/toggle.js';

export default {
  fits, events, update,

  css : `
    [part~="control"] {
      border         : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius  : var(--radius-control, 0.4em);
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.75em;
    }

    [part~="checked"] { background: var(--color-ink, AccentColor); border-color: transparent; color: var(--color-bg, Canvas); }
  `,

  render : host => control(host, '', null),
  focus  : controlOf,
};
