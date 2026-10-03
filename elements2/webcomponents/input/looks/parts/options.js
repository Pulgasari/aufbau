import { attrs, html } from '../../../../lib/html.js';
import { nextIndex }   from './keys.js';

export const isInactive = item => item.hidden || item.matches(':disabled, [aria-disabled="true"]');

export const optionIcon = entry => entry.icon && html`<svg-icon part="icon" icon="${entry.icon}"></svg-icon>`;

export const labelOf = entry => entry.label || entry.value;

export function optionButtons (host, part, { iconsOnly = host.getAttr('iconsOnly'), mark = false } = {}) {
  const role      = host.count === 'multiple' ? 'checkbox' : 'radio';

  return html`${host.options.map(entry => {
    const name      = labelOf(entry);
    const showLabel = !(iconsOnly && entry.icon);

    return html`
      <button type="button" part="${part}" role="${role}" data-value="${entry.value}" tabindex="-1" aria-checked="false"
              ${attrs({ 'aria-label': !showLabel && name, disabled: entry.disabled, title: !showLabel && name })}>
        ${mark && html`<span part="mark"></span>`}
        ${optionIcon(entry)}
        ${showLabel && html`<span part="label">${name}</span>`}
      </button>
    `;
  })}`;
}

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

export function updateTabStop (host, items) {
  const selected = host.selected;
  const stop     = items.find(item => selected.has(item.dataset.value) && !isInactive(item)) ?? items.find(item => !isInactive(item));
  for (const item of items) item.tabIndex = item === stop ? 0 : -1;
}

export function groupEvents (host, on) {
  on('click', '[data-value]', (event, item) => { if (!isInactive(item)) host.select(item.dataset.value); });

  on(host.root, 'keydown', event => {
    if (event.target.localName === 'input') return;

    const items   = [...host.root.querySelectorAll('[data-value]')].filter(item => !isInactive(item));
    const current = items.indexOf(event.target.closest?.('[data-value]'));
    const index   = nextIndex(event.key, current, items.length);
    if (index === null || !items.length) return;

    event.preventDefault();
    const next = items[index];
    next.focus();
    if (host.count !== 'multiple') host.select(next.dataset.value);
  });
}

// what every look showing all options at once shares
export const GROUP = {
  events : groupEvents,
  focus  : host => host.root.querySelector('[data-value][tabindex="0"]'),
  role   : host => host.count === 'multiple' ? 'group' : 'radiogroup',
  update : host => updateTabStop(host, updateSelected(host)),
};
