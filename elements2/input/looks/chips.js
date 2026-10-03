import { html }        from '../../lib/html.js';
import { FRAME, icon } from './parts/field.js';

const inputOf = host => host.root.querySelector('[part~="input"]');

const refocus = host => queueMicrotask(() => inputOf(host)?.focus());

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'multiple',

  css : `
    ${FRAME}
    [part~="box"] { flex-wrap: wrap; gap: 0.35em; padding-block: 0.3em; }

    [part~="chip"] {
      align-items   : center;
      background    : color-mix(in srgb, currentColor 12%, transparent);
      border-radius : var(--radius-control, 0.4em);
      display       : inline-flex;
      gap           : 0.25em;
      padding       : 0.1em 0.25em 0.1em 0.5em;
    }

    [part~="remove"] { --icon-size: 0.85em; opacity: 0.65; }
    [part~="input"]  { flex: 1 1 6em; }
  `,

  render : host => html`
    ${icon(host)}
    ${host.values.map((value, index) => html`
      <span part="chip">
        <span part="label">${value}</span>
        <button type="button" part="remove" data-index="${index}" aria-label="${`remove ${value}`}" tabindex="-1"><svg-icon icon="lucide:x"></svg-icon></button>
      </span>
    `)}
    <input part="input" type="${host.valueType.input}" placeholder="${host.placeholder || 'add…'}" enterkeyhint="done" />
  `,

  events (host, on) {
    const add = input => { if (input.value.trim()) { host.add(input.value); refocus(host); } };

    on('click', '[part~="remove"]', (event, button) => host.removeAt(Number(button.dataset.index)));
    on(host.root, 'change', event => { if (event.target === inputOf(host)) add(event.target); });

    on(host.root, 'keydown', event => {
      const input = inputOf(host);
      if (event.target !== input) return;

      if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(input); }
      else if (event.key === 'Backspace' && !input.value && host.values.length) { host.removeAt(host.values.length - 1); refocus(host); }
    });
  },

  update (host) { const input = inputOf(host); if (input) input.readOnly = Boolean(host.getAttr('readonly')); },

  focus : inputOf,
};
