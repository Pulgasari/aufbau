import { attrs, html }                     from '../../../../lib/html.js';
import { place }                           from '../../../../lib/placement.js';
import { nextIndex }                       from './keys.js';
import { isInactive, labelOf, optionIcon } from './options.js';

export const triggerOf = host => host.root.querySelector('[aria-haspopup]');
export const isOpen    = host => host.part('listbox').matches(':popover-open');

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
    border              : var(--input-line);
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

// below the anchor, above it where there is no room
export function reposition (host, anchor) {
  const list = host.part('listbox').node;
  if (list && isOpen(host)) host.dataset.placement = place(list, anchor);
}

export function setOpen (host, open, anchor) {
  const list = host.part('listbox').node;
  if (!list || host.disabled || open === isOpen(host)) return;

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
  for (const item of host.part('listbox').$$('[role="option"]')) {
    item.hidden = Boolean(needle) && !item.textContent.toLowerCase().includes(needle);
  }
}

const enabledItems = host => host.part('listbox').$$('[data-value]').filter(item => !isInactive(item)).nodes;

export function popoverEvents (host, scope, anchor) {
  const close = () => setOpen(host, false, anchor());

  scope.on('click', '[role="option"]', (event, item) => {
    if (isInactive(item)) return;
    host.select(item.dataset.value);
    if (host.count !== 'multiple') close();
  });

  scope.$(document).on('pointerdown', event => { if (!event.composedPath().includes(host)) close(); });

  const follow = () => reposition(host, anchor());
  scope.$(window).on('resize', follow, { passive: true });
  scope.$(window).on('scroll', follow, { capture: true, passive: true });

  scope.$(host.root).on('keydown', event => {
    const { key } = event;
    const item    = event.target.closest?.('[data-value]');

    if (key === 'Escape' && isOpen(host)) { event.preventDefault(); close(); return; }
    if ((key === 'Enter' || key === ' ') && item) { event.preventDefault(); item.click(); return; }

    const items    = enabledItems(host);
    const selected = items.findIndex(entry => host.selected.has(entry.dataset.value));
    const current  = item ? items.indexOf(item) : selected;

    // left and right belong to the caret of a search field
    const index = nextIndex(key, current, items.length, { sideways: false });
    if (index === null) return;
    event.preventDefault();

    if (!isOpen(host)) setOpen(host, true, anchor());
    items[index]?.focus();
  });
}
