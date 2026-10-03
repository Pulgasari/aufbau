// @aufbau/elements2/input/looks/parts/toggle.js
// what the bool looks share: one button carries role and state, the label is its content.
// `icon` and `icon-checked` put an icon into it

import { attrs, html } from '../../../lib/html.js';

export const fits = shape => shape.kind === 'bool';

const iconsOf = host => {
  const { icon, iconChecked } = host.getAttr();
  return icon || iconChecked ? { off: icon || iconChecked, on: iconChecked || icon } : null;
};

export function control (host, inner, role) {
  const label = host.getAttr('label');
  return html`
    <button type="button" part="control" ${attrs({ role })}>
      ${inner}
      ${iconsOf(host) && html`<svg-icon part="icon"></svg-icon>`}
      ${label && html`<span part="label">${label}</span>`}
    </button>
  `;
}

export const controlOf = host => host.root.querySelector('[part~="control"]');

export const events = (host, on) => on('click', '[part~="control"]', () => host.toggle());

export function update (host) {
  const button  = controlOf(host);
  const checked = host.checked;

  button.setAttribute(host.look === 'button' ? 'aria-pressed' : 'aria-checked', String(checked));
  button.part.toggle('checked', checked);

  const icons = iconsOf(host);
  if (icons) button.querySelector('svg-icon').setAttribute('icon', checked ? icons.on : icons.off);
}
