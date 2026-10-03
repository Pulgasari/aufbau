// @aufbau/elements2/input/looks/parts/options.js
// what the list looks share: the markup of an option, its selected state, the arrow keys

import { attrs, html } from '../../../core/html.js';

export const isInactive = item => item.hidden || item.matches(':disabled, [aria-disabled="true"]');

export const optionIcon = entry => entry.icon && html`<svg-icon part="icon" icon="${entry.icon}"></svg-icon>`;

export const labelOf = entry => entry.label || entry.value;

/** every option as a button, for the looks that show them all at once */
export function optionButtons (host, part) {
  const iconsOnly = host.getAttr('iconsOnly');
  const role      = host.count === 'multiple' ? 'checkbox' : 'radio';

  return html`${host.options.map(entry => {
    const name      = labelOf(entry);
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

/** aria for assistive tech, the part token `selected` for css: ::part() takes no attribute selectors */
export function updateSelected (host) {
  const selected = host.selected;
  const items    = [...host.root.querySelectorAll('[data-value]')];

  for (const item of items) {
    const active = selected.has(item.dataset.value);
    item.setAttribute(item.getAttribute('role') === 'option' ? 'aria-selected' : 'aria-checked', String(active));
    item.part.toggle('selected', active);
  }

  return items;
}

/** one tab stop per group: the selected option, else the first */
export function updateTabStop (host, items) {
  const selected = host.selected;
  const stop     = items.find(item => selected.has(item.dataset.value) && !isInactive(item)) ?? items.find(item => !isInactive(item));
  for (const item of items) item.tabIndex = item === stop ? 0 : -1;
}

/** a click picks, the arrows move through the group and pick along unless it is `multiple` */
export function groupEvents (host, on) {
  on('click', '[data-value]', (event, item) => { if (!isInactive(item)) host.select(item.dataset.value); });

  on(host.root, 'keydown', event => {
    const { key } = event;
    const step    = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 0;
    if (!step && key !== 'Home' && key !== 'End') return;

    const items = [...host.root.querySelectorAll('[data-value]')].filter(item => !isInactive(item));
    if (!items.length) return;
    event.preventDefault();

    const current = items.indexOf(event.target.closest?.('[data-value]'));
    const next    = items[key === 'Home' ? 0 : key === 'End' ? items.length - 1 : (current + step + items.length) % items.length];
    next.focus();
    if (host.count !== 'multiple') host.select(next.dataset.value);
  });
}
