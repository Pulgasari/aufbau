import { control, events, fits, update } from './parts/toggle.js';

export default {
  fits, events, update,

  css : `
    [part~="control"] {
      border         : var(--input-line);
      border-radius  : --radius();
      min-block-size : --space(9);
      padding-inline : --space(normal);
    }

    [part~="checked"] { background: var(--color-ink, AccentColor); border-color: transparent; color: var(--color-bg, Canvas); }
  `,

  render : host => control(host, '', null),
  focus  : host => host.part('control').node,
};
