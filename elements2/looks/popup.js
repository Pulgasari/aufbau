// @aufbau/elements2/looks/popup.js
// a list in a popover, top layer, placed by ../core/placement.js.
//
//   combobox  the host is the field, `searchable` filters the list while typing.
//             parts: icon, input, caret, listbox, option, label
//   cycle     a button showing the current option. a click takes the next one,
//             a long press or the context menu opens the list. always one value.
//             parts: button, icon, label, listbox, option

import { attrs, html }                                             from '../core/html.js';
import { place }                                                   from '../core/placement.js';
import { BOX, iconPart }                                           from './field.js';
import { isInactive, listOption, selectedLabels, syncSelected }    from './list.js';

const LONG_PRESS = 500;

// :::::: POPOVER :::::::::::::::::::::::::::::::::::::::::::::::

const listboxOf = host => host.root.querySelector('[part~="listbox"]');
const triggerOf = host => host.root.querySelector('[aria-haspopup]');

const isOpen = host => listboxOf(host)?.matches(':popover-open') ?? false;

function setOpen (host, open) {
  const list = listboxOf(host);
  if (!list || host.isDisabled || open === isOpen(host)) return;

  // read before hiding, a hidden popover has already dropped its focus
  const hadFocus = list.contains(host.focused);

  list[open ? 'showPopover' : 'hidePopover']();
  triggerOf(host)?.setAttribute('aria-expanded', String(open));

  if (open) {
    reposition(host);
    list.querySelector('[part~="selected"]')?.scrollIntoView({ block: 'nearest' });
    return;
  }

  if (hadFocus) triggerOf(host)?.focus();
  filter(host, '');
}

function reposition (host) {
  const list = listboxOf(host);
  if (!list || !isOpen(host)) return;
  host.dataset.placement = place(list, host.look === 'cycle' ? triggerOf(host) : host);
}

function filter (host, query) {
  const needle = String(query ?? '').trim().toLowerCase();
  for (const item of listboxOf(host)?.querySelectorAll('[role="option"]') ?? []) {
    item.hidden = Boolean(needle) && !item.textContent.toLowerCase().includes(needle);
  }
  reposition(host);
}

const navigable = host => [...(listboxOf(host)?.querySelectorAll('[data-value]') ?? [])].filter(item => !isInactive(item));

/** into the open list, onto the selected option where there is one */
function focusList (host) {
  const items = navigable(host);
  (items.find(item => host.selected.has(item.dataset.value)) ?? items[0])?.focus();
}

function onKeydown (host, event) {
  const { key } = event;

  if (key === 'Escape' && isOpen(host)) { event.preventDefault(); setOpen(host, false); return; }

  const item = event.target.closest?.('[data-value]');
  if ((key === 'Enter' || key === ' ') && item) { event.preventDefault(); host.select(item.dataset.value); return; }

  // left and right belong to the caret of the search field
  const step = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;

  if (step && !isOpen(host)) { event.preventDefault(); setOpen(host, true); focusList(host); return; }
  if (!step && key !== 'Home' && key !== 'End') return;
  if (!listboxOf(host)?.contains(event.target)) return;

  const items = navigable(host);
  if (!items.length) return;
  event.preventDefault();

  const current = items.indexOf(item);
  items[key === 'Home' ? 0 : key === 'End' ? items.length - 1 : (current + step + items.length) % items.length].focus();
}

// what both looks bind: keys, a click outside, the placement on scroll and resize
function bindPopover (host, on) {
  on(host.root, 'keydown', event => onKeydown(host, event));
  on(document, 'pointerdown', event => { if (!event.composedPath().includes(host)) setOpen(host, false); });

  const follow = () => reposition(host);
  on(window, 'resize', follow, { passive: true });
  on(window, 'scroll', follow, { capture: true, passive: true });
}

const listbox = host => html`
  <div part="listbox" role="listbox" popover="manual" ${attrs({ 'aria-multiselectable': host.count === 'multiple' && 'true' })}>
    ${host.options.map(listOption)}
  </div>
`;

const LISTBOX_STYLES = `
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

    &:hover, &:focus     { background: color-mix(in srgb, currentColor 10%, transparent); }
    &[part~="selected"]  { color: var(--color-ink, AccentColor); }
    &[aria-disabled="true"] { cursor: not-allowed; opacity: 0.5; }
  }

  [part~="label"] { min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

// :::::: LOOKS :::::::::::::::::::::::::::::::::::::::::::::::::

export const combobox = {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  styles : `
    ${LISTBOX_STYLES}

    :host([look="combobox"]) [part~="box"] { ${BOX} cursor: pointer; }

    :host([look="combobox"]) [part~="box"]:focus-within { border-color: var(--color-ink, Highlight); }

    :host([look="combobox"]) [part~="input"] {
      cursor        : inherit;
      flex          : 1 1 auto;
      inline-size   : 100%;
      text-overflow : ellipsis;

      &[aria-expanded="true"] ~ [part~="caret"] { rotate: 180deg; }
    }

    :host([look="combobox"]) [part~="caret"] { flex: none; opacity: 0.65; transition: rotate 0.15s ease; }
  `,

  render (host) {
    const { placeholder, searchable } = host.getAttr();
    return html`
      ${iconPart(host)}
      <input type="text" part="input" role="combobox" aria-haspopup="listbox" aria-expanded="false"
             ${attrs({ placeholder: placeholder ?? 'select…', readonly: !searchable })} />
      <svg-icon part="caret" icon="lucide:chevron-down"></svg-icon>
      ${listbox(host)}
    `;
  },

  sync (host) {
    syncSelected(host);
    const input = triggerOf(host);
    if (input && input !== host.focused) input.value = selectedLabels(host).join(', ');
  },

  bind (host, on) {
    bindPopover(host, on);

    // the click lands on the host from inside, the composed path knows where it came from
    on('click', event => {
      if (event.composedPath().includes(listboxOf(host))) return;
      setOpen(host, !isOpen(host));
    });

    on(host.root, 'input', event => {
      if (event.target !== triggerOf(host)) return;
      setOpen(host, true);
      filter(host, event.target.value);
    });

    // the search text is no value, the field shows the selection again once it is left
    on(host.root, 'focusout', event => {
      if (event.target === triggerOf(host) && !isOpen(host)) combobox.sync(host);
    });
  },

  selected (host) { if (host.count !== 'multiple') setOpen(host, false); },

  focusTarget : host => triggerOf(host),
};

export const cycle = {
  fits : shape => shape.kind === 'list' && shape.count === 'single',

  styles : `
    ${LISTBOX_STYLES}

    :host([look="cycle"]) [part~="button"] {
      -webkit-touch-callout : none;
      border                : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius         : var(--radius-control, 0.4em);
      min-block-size        : var(--control-size, 2.25em);
      padding-inline        : 0.75em;
      user-select           : none;
    }
  `,

  // the content is set in sync(), a click must not rebuild the button it lands on
  render : host => html`
    <button type="button" part="button" aria-haspopup="listbox" aria-expanded="false">
      <svg-icon part="icon" hidden></svg-icon>
      <span part="label"></span>
    </button>
    ${listbox(host)}
  `,

  sync (host) {
    syncSelected(host);

    const button  = triggerOf(host);
    if (!button) return;
    const current = host.options.find(entry => entry.value === host.value);
    const name    = current ? (current.label || current.value) : (host.getAttr('placeholder') ?? 'select…');
    const icon    = button.querySelector('svg-icon');
    const label   = button.querySelector('[part~="label"]');

    icon.hidden = !current?.icon;
    if (current?.icon) icon.setAttribute('icon', current.icon);
    label.textContent = name;
    label.hidden      = Boolean(host.getAttr('iconsOnly') && current?.icon);
    button.title      = name;
    button.setAttribute('aria-label', name);
  },

  bind (host, on) {
    bindPopover(host, on);

    let timer   = null;
    let pressed = false;

    on(host.root, 'pointerdown', event => {
      if (event.button !== 0 || !event.target.closest?.('[aria-haspopup]')) return;
      pressed = false;
      clearTimeout(timer);
      timer = setTimeout(() => { pressed = true; setOpen(host, true); }, LONG_PRESS);
    });

    // the click that ends a long press must not step on as well, it follows pointerup within the task
    const release = () => { clearTimeout(timer); if (pressed) setTimeout(() => { pressed = false; }); };
    on(window, 'pointerup',     release);
    on(window, 'pointercancel', release);

    on(host.root, 'click', event => {
      if (!event.target.closest?.('[aria-haspopup]') || pressed) return;
      if (isOpen(host)) setOpen(host, false); else host.cycle(1);
    });

    on(host.root, 'contextmenu', event => {
      if (!event.target.closest?.('[aria-haspopup]')) return;
      event.preventDefault();
      setOpen(host, true);
    });
  },

  selected : host => setOpen(host, false),

  focusTarget : host => triggerOf(host),
};
