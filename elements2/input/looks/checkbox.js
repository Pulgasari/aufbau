import { html }                                     from '../../lib/html.js';
import { control, controlOf, events, fits, update } from './parts/toggle.js';

export default {
  fits, events, update,

  css : `
    [part~="check"] {
      align-items     : center;
      block-size      : 1.15em;
      border          : var(--border-width, 1px) solid color-mix(in srgb, currentColor 45%, transparent);
      border-radius   : calc(var(--radius-control, 0.4em) * 0.5);
      display         : inline-flex;
      flex            : none;
      inline-size     : 1.15em;
      justify-content : center;
    }

    [part~="mark"] { --icon-size: 0.85em; visibility: hidden; }

    [part~="checked"] [part~="check"] { background: var(--color-ink, AccentColor); border-color: transparent; color: var(--color-bg, Canvas); }
    [part~="checked"] [part~="mark"]  { visibility: visible; }
  `,

  render : host => control(host, html`<span part="check"><svg-icon part="mark" icon="lucide:check"></svg-icon></span>`, 'checkbox'),
  focus  : controlOf,
};
