// @aufbau/elements2/looks/inline.js
// every option at once. one of them, or any number with `multiple`.
//
//   radio     stacked, with a mark. parts: option, mark, icon, label
//   segments  one seamless row.     parts: segment, icon, label
//
// `icons-only` hides the label of an option with an icon, it stays its name.

import { attrs, html }                            from '../core/html.js';
import { isInactive, optionIcon, syncSelected }  from './list.js';

function renderOptions (host, part) {
  const iconsOnly = host.getAttr('iconsOnly');
  const role      = host.count === 'multiple' ? 'checkbox' : 'radio';

  return html`${host.options.map(entry => {
    const name      = entry.label || entry.value;
    const showLabel = !(iconsOnly && entry.icon);

    return html`
      <button type="button" part="${part}" role="${role}" data-value="${entry.value}" tabindex="-1" aria-checked="false"
              ${attrs({ 'aria-label': !showLabel && name, disabled: entry.disabled, title: !showLabel && name })}>
        ${part === 'option' && html`<span part="mark"></span>`}
        ${optionIcon(entry)}
        ${showLabel && html`<span part="label">${name}</span>`}
      </button>
    `;
  })}`;
}

// roving tabindex: one stop per group, the selected one where there is one
function sync (host) {
  const items    = syncSelected(host);
  const selected = host.selected;
  const stop     = items.find(item => selected.has(item.dataset.value) && !isInactive(item)) ?? items.find(item => !isInactive(item));
  for (const item of items) item.tabIndex = item === stop ? 0 : -1;
}

// the arrows move the focus through the group, around at both ends
function bind (host, on) {
  on(host.root, 'keydown', event => {
    const { key } = event;
    const step = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 0;
    if (!step && key !== 'Home' && key !== 'End') return;

    const items = [...host.root.querySelectorAll('[data-value]')].filter(item => !isInactive(item));
    if (!items.length) return;
    event.preventDefault();

    const current = items.indexOf(event.target.closest?.('[data-value]'));
    const next    = key === 'Home' ? 0 : key === 'End' ? items.length - 1 : (current + step + items.length) % items.length;
    items[next].focus();

    // one of them follows the focus, like a native radio group
    if (host.count !== 'multiple') host.select(items[next].dataset.value);
  });
}

const role = host => host.count === 'multiple' ? 'group' : 'radiogroup';

const fits = shape => shape.kind === 'list' && shape.count !== 'range';

const focusTarget = host => host.root.querySelector('[data-value][tabindex="0"]');

export const radio = {
  fits, bind, focusTarget, role, sync,

  styles : `
    :host([look="radio"]) [part~="box"] { align-items: flex-start; flex-direction: column; gap: 0.35em; }

    :host([look="radio"]) [part~="option"] { gap: 0.5em; justify-content: flex-start; }

    :host([look="radio"]) [part~="mark"] {
      block-size    : 1em;
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 45%, transparent);
      border-radius : 50%;
      flex          : none;
      inline-size   : 1em;
    }

    :host([look="radio"]) [role="checkbox"] [part~="mark"] { border-radius: calc(var(--radius-control, 0.4em) * 0.5); }

    :host([look="radio"]) [part~="option"][part~="selected"] [part~="mark"] {
      background : var(--color-ink, AccentColor);
      border     : 0.3em solid var(--color-bg, Canvas);
      outline    : var(--border-width, 1px) solid var(--color-ink, AccentColor);
    }
  `,

  render : host => renderOptions(host, 'option'),
};

export const segments = {
  fits, bind, focusTarget, role, sync,

  styles : `
    :host([look="segments"]) [part~="box"] {
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius : var(--radius-control, 0.4em);
      gap           : 0;
      overflow      : hidden;
    }

    :host([look="segments"]) [part~="segment"] {
      flex           : 1 1 auto;
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.75em;

      & + [part~="segment"] { border-inline-start: var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent); }

      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render : host => renderOptions(host, 'segment'),
};
