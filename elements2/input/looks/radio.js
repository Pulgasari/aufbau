// look="radio": every option stacked, with a mark. one, or any number with `multiple`
// parts: box, option, mark, icon, label

import { groupEvents, optionButtons, updateSelected, updateTabStop } from './parts/options.js';

export default {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    [part~="box"]    { align-items: flex-start; flex-direction: column; gap: 0.35em; }
    [part~="option"] { gap: 0.5em; justify-content: flex-start; }

    [part~="mark"] {
      block-size    : 1em;
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 45%, transparent);
      border-radius : 50%;
      flex          : none;
      inline-size   : 1em;
    }

    [role="checkbox"] [part~="mark"] { border-radius: calc(var(--radius-control, 0.4em) * 0.5); }

    [part~="selected"] [part~="mark"] {
      background : var(--color-ink, AccentColor);
      border     : 0.3em solid var(--color-bg, Canvas);
      outline    : var(--border-width, 1px) solid var(--color-ink, AccentColor);
    }
  `,

  render : host => optionButtons(host, 'option'),
  events : groupEvents,
  update : host => updateTabStop(host, updateSelected(host)),
  role   : host => host.count === 'multiple' ? 'group' : 'radiogroup',
  focus  : host => host.root.querySelector('[data-value][tabindex="0"]'),
};
