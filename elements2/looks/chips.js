// @aufbau/elements2/looks/chips.js
// any number of typed values, each a chip. enter or a comma adds what was
// typed, backspace in the empty field takes the last one back.
// parts: chip, label, remove, input

import { html }       from '../core/html.js';
import { BOX, iconPart } from './field.js';

const fieldOf = host => host.root.querySelector('[part~="input"]');

export const chips = {
  fits : shape => shape.kind === 'free' && shape.count === 'multiple',

  styles : `
    :host([look="chips"]) [part~="box"] { ${BOX} flex-wrap: wrap; gap: 0.35em; padding-block: 0.3em; }

    :host([look="chips"]) [part~="box"]:focus-within { border-color: var(--color-ink, Highlight); }

    :host([look="chips"]) [part~="chip"] {
      align-items   : center;
      background    : color-mix(in srgb, currentColor 12%, transparent);
      border-radius : var(--radius-control, 0.4em);
      display       : inline-flex;
      gap           : 0.25em;
      padding       : 0.1em 0.25em 0.1em 0.5em;
    }

    :host([look="chips"]) [part~="remove"] { --icon-size: 0.85em; opacity: 0.65; }

    :host([look="chips"]) [part~="input"] { flex: 1 1 6em; }
  `,

  render (host) {
    const { placeholder } = host.getAttr();
    return html`
      ${iconPart(host)}
      ${host.values.map((value, index) => html`
        <span part="chip">
          <span part="label">${value}</span>
          <button type="button" part="remove" data-remove="${index}" aria-label="${`remove ${value}`}" tabindex="-1"><svg-icon icon="lucide:x"></svg-icon></button>
        </span>
      `)}
      <input part="input" type="${host.valueType.input}" placeholder="${placeholder ?? 'add…'}" enterkeyhint="done" />
    `;
  },

  sync (host) { const input = fieldOf(host); if (input) input.readOnly = Boolean(host.getAttr('readonly')); },

  bind (host, on) {
    // the chips are part of the markup, an added one rebuilds it: the new field takes the focus back
    const add = input => {
      if (!input.value.trim()) return;
      host.add(input.value);
      queueMicrotask(() => fieldOf(host)?.focus());
    };

    on(host.root, 'keydown', event => {
      const input = fieldOf(host);
      if (event.target !== input) return;

      if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(input); return; }
      if (event.key === 'Backspace' && !input.value && host.values.length) {
        host.removeAt(host.values.length - 1);
        queueMicrotask(() => fieldOf(host)?.focus());
      }
    });

    on(host.root, 'change', event => { if (event.target === fieldOf(host)) add(event.target); });
  },

  focusTarget : fieldOf,
};
