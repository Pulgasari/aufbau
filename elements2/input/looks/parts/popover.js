// @aufbau/elements2/input/looks/parts/popover.js
// a list of options in a popover, top layer, for combobox and cycle

import { attrs, html }                         from '../../../core/html.js';
import { place }                               from '../../../core/placement.js';
import { isInactive, labelOf, optionIcon }    from './options.js';

export const listboxOf = host => host.root.querySelector('[part~="listbox"]');
export const triggerOf = host => host.root.querySelector('[aria-haspopup]');
export const isOpen    = host => listboxOf(host)?.matches(':popover-open') ?? false;

export const listbox = host => html`
  <div part="listbox" role="listbox" popover="manual" ${attrs({ 'aria-multiselectable': host.count === 'multiple' && 'true' })}>
    ${host.options.map(entry => html`
      <div part="option" role="option" data-value="${entry.value}" tabindex="-1" aria-selected="false" ${attrs({ 'aria-disabled': entry.disabled && 'true' })}>
        ${optionIcon(entry)}
        <span part="label">${labelOf(entry)}</span>
      </div>
    `)}
  </div>
`;

export const LISTBOX = `
  [part~="listbox"] {
    background          : var(--color-bg, Canvas);
    border              : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
    border-radius       : var(--radius-control, 0.4em);
    color               : inherit;
    margin              : 0;
    max-block-size      : var(--list-size, 15em);
    overflow-y          : auto;
    overscroll-behavior : contain;
    padding             : 0.25em;
    position            : fixed;
  }

  [part~="option"] {
    align-items   : center;
    border-radius : calc(var(--radius-control, 0.4em) * 0.75);
    cursor        : pointer;
    display       : flex;
    gap           : 0.5em;
    padding       : 0.35em 0.5em;

    &:hover, &:focus        { background: color-mix(in srgb, currentColor 10%, transparent); }
    &[part~="selected"]     { color: var(--color-ink, AccentColor); }
    &[aria-disabled="true"] { cursor: not-allowed; opacity: 0.5; }
  }

  [part~="label"] { min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

/** below the anchor, above it where there is no room */
export function reposition (host, anchor) {
  const list = listboxOf(host);
  if (list && isOpen(host)) host.dataset.placement = place(list, anchor);
}

export function setOpen (host, open, anchor) {
  const list = listboxOf(host);
  if (!list || host.isDisabled || open === isOpen(host)) return;

  // read before hiding, a hidden popover has already dropped its focus
  const hadFocus = list.contains(host.focused);

  list[open ? 'showPopover' : 'hidePopover']();
  triggerOf(host)?.setAttribute('aria-expanded', String(open));

  if (open) {
    reposition(host, anchor);
    list.querySelector('[part~="selected"]')?.scrollIntoView({ block: 'nearest' });
  }
  else {
    filter(host, '');
    if (hadFocus) triggerOf(host)?.focus();
  }
}

export function filter (host, query) {
  const needle = String(query ?? '').trim().toLowerCase();
  for (const item of listboxOf(host)?.querySelectorAll('[role="option"]') ?? []) {
    item.hidden = Boolean(needle) && !item.textContent.toLowerCase().includes(needle);
  }
}

const enabledItems = host => [...(listboxOf(host)?.querySelectorAll('[data-value]') ?? [])].filter(item => !isInactive(item));

/**
 * what both looks bind: a click on an option, the keys, a click outside, the
 * placement on scroll and resize. `anchor` is what the list hangs below
 */
export function popoverEvents (host, on, anchor) {
  const close = () => setOpen(host, false, anchor());

  on('click', '[role="option"]', (event, item) => {
    if (isInactive(item)) return;
    host.select(item.dataset.value);
    if (host.count !== 'multiple') close();
  });

  on(document, 'pointerdown', event => { if (!event.composedPath().includes(host)) close(); });

  const follow = () => reposition(host, anchor());
  on(window, 'resize', follow, { passive: true });
  on(window, 'scroll', follow, { capture: true, passive: true });

  on(host.root, 'keydown', event => {
    const { key } = event;
    const item    = event.target.closest?.('[data-value]');

    if (key === 'Escape' && isOpen(host)) { event.preventDefault(); close(); return; }
    if ((key === 'Enter' || key === ' ') && item) { event.preventDefault(); item.click(); return; }

    // left and right belong to the caret of a search field
    const step = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
    if (!step && key !== 'Home' && key !== 'End') return;
    event.preventDefault();

    if (!isOpen(host)) setOpen(host, true, anchor());
    const items = enabledItems(host);
    if (!items.length) return;

    const current = item ? items.indexOf(item) : items.findIndex(entry => host.selected.has(entry.dataset.value));
    const next    = key === 'Home' ? 0 : key === 'End' ? items.length - 1 : current < 0 ? 0 : (current + step + items.length) % items.length;
    items[next].focus();
  });
}
