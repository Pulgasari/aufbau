// @aufbau/elements2/looks/list.js
// what the list looks share: the markup of an option and its selected state

import { attrs, html } from '../core/html.js';

export const isInactive = item => item.hidden || item.matches(':disabled, [aria-disabled="true"]');

export const optionIcon = entry => entry.icon && html`<svg-icon part="icon" icon="${entry.icon}"></svg-icon>`;

/** an entry of a popover list */
export const listOption = entry => html`
  <div part="option" role="option" data-value="${entry.value}" tabindex="-1" aria-selected="false" ${attrs({ 'aria-disabled': entry.disabled && 'true' })}>
    ${optionIcon(entry)}
    <span part="label">${entry.label || entry.value}</span>
  </div>
`;

/** aria for assistive tech, the part token `selected` for css: ::part() takes no attribute selectors */
export function syncSelected (host) {
  const selected = host.selected;
  const items    = [...host.root.querySelectorAll('[data-value]')];

  for (const item of items) {
    const active = selected.has(item.dataset.value);
    item.setAttribute(item.getAttribute('role') === 'option' ? 'aria-selected' : 'aria-checked', String(active));
    item.part.toggle('selected', active);
  }

  return items;
}

/** the labels of the selected values, in the order of the options */
export const selectedLabels = host => {
  const selected = host.selected;
  return host.options.filter(entry => selected.has(entry.value)).map(entry => entry.label || entry.value);
};
