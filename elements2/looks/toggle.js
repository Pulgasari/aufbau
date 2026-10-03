// @aufbau/elements2/looks/toggle.js
// on or off. one button carries the role and the state, the label is its content.
//
//   switch    parts: control, track, thumb, label
//   checkbox  parts: control, check, mark, label
//   button    parts: control, icon, label. reads as pressed
//
// `icon` (and `icon-checked`) put an icon into the button, on every look.

import { attrs, html } from '../core/html.js';

const fits = shape => shape.kind === 'bool';

const iconsOf = host => {
  const icon    = host.getAttribute('icon');
  const checked = host.getAttribute('icon-checked');
  return icon || checked ? { checked: checked || icon, unchecked: icon || checked } : null;
};

function render (host, inner, role) {
  const label = host.getAttr('label');
  return html`
    <button type="button" part="control" data-toggle ${attrs({ role })}>
      ${inner}
      ${iconsOf(host) && html`<svg-icon part="icon"></svg-icon>`}
      ${label && html`<span part="label">${label}</span>`}
    </button>
  `;
}

function sync (host) {
  const button  = host.root.querySelector('[part~="control"]');
  if (!button) return;
  const checked = host.checked;

  if (host.look === 'button') button.setAttribute('aria-pressed', String(checked));
  else button.setAttribute('aria-checked', String(checked));
  button.part.toggle('checked', checked);

  // the visible label names the control, the host label goes onto the button where there is none
  const label = host.getAttr('label');
  if (label) button.removeAttribute('aria-label');
  else if (host.getAttribute('aria-label')) button.setAttribute('aria-label', host.getAttribute('aria-label'));

  const icons = iconsOf(host);
  if (icons) button.querySelector('svg-icon')?.setAttribute('icon', checked ? icons.checked : icons.unchecked);
}

const focusTarget = host => host.root.querySelector('[part~="control"]');

const CONTROL = `
  [part~="control"] { gap: 0.5em; }
  [part~="control"]:focus-visible { outline: 2px solid var(--color-ink, Highlight); outline-offset: 2px; }
`;

export const toggle = {
  fits, focusTarget, sync,

  styles : `
    ${CONTROL}

    :host([look="switch"]) {
      --switch-size : 1.25em;
      --switch-pad  : 0.15em;
    }

    :host([look="switch"]) [part~="track"] {
      background    : color-mix(in srgb, currentColor 25%, transparent);
      block-size    : var(--switch-size);
      border-radius : var(--switch-size);
      flex          : none;
      inline-size   : calc(var(--switch-size) * 1.8);
      position      : relative;
      transition    : background 0.15s ease;
    }

    :host([look="switch"]) [part~="thumb"] {
      background         : var(--color-bg, Canvas);
      block-size         : calc(var(--switch-size) - 2 * var(--switch-pad));
      border-radius      : 50%;
      inline-size        : calc(var(--switch-size) - 2 * var(--switch-pad));
      inset-block-start  : var(--switch-pad);
      inset-inline-start : var(--switch-pad);
      position           : absolute;
      transition         : translate 0.15s ease;
    }

    :host([look="switch"]) [part~="checked"] [part~="track"] { background: var(--color-ink, AccentColor); }
    :host([look="switch"]) [part~="checked"] [part~="thumb"] { translate: calc(var(--switch-size) * 0.8) 0; }
  `,

  render : host => render(host, html`<span part="track"><span part="thumb"></span></span>`, 'switch'),
};

export const checkbox = {
  fits, focusTarget, sync,

  styles : `
    ${CONTROL}

    :host([look="checkbox"]) [part~="check"] {
      align-items     : center;
      block-size      : 1.15em;
      border          : var(--border-width, 1px) solid color-mix(in srgb, currentColor 45%, transparent);
      border-radius   : calc(var(--radius-control, 0.4em) * 0.5);
      display         : inline-flex;
      flex            : none;
      inline-size     : 1.15em;
      justify-content : center;
    }

    :host([look="checkbox"]) [part~="mark"] { --icon-size: 0.85em; visibility: hidden; }

    :host([look="checkbox"]) [part~="checked"] [part~="check"]  { background: var(--color-ink, AccentColor); border-color: transparent; color: var(--color-bg, Canvas); }
    :host([look="checkbox"]) [part~="checked"] [part~="mark"] { visibility: visible; }
  `,

  render : host => render(host, html`<span part="check"><svg-icon part="mark" icon="lucide:check"></svg-icon></span>`, 'checkbox'),
};

export const button = {
  fits, focusTarget, sync,

  styles : `
    ${CONTROL}

    :host([look="button"]) [part~="control"] {
      border         : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius  : var(--radius-control, 0.4em);
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.75em;
    }

    :host([look="button"]) [part~="checked"] { background: var(--color-ink, AccentColor); border-color: transparent; color: var(--color-bg, Canvas); }
  `,

  render : host => render(host, '', null),
};
