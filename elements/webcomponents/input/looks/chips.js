import { html }        from '../../../lib/html.js';
import { FRAME, icon } from './parts/field.js';


const refocus = host => queueMicrotask(() => host.part('input').focus());

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

  events (host, scope) {
    const add = input => { if (input.value.trim()) { host.add(input.value); refocus(host); } };

    scope.on('click', '[part~="remove"]', (event, button) => host.removeAt(Number(button.dataset.index)));
    scope.$(host.root).on('change', event => { if (event.target === host.part('input').node) add(event.target); });

    scope.$(host.root).on('keydown', event => {
      const input = host.part('input').node;
      if (event.target !== input) return;

      if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(input); }
      else if (event.key === 'Backspace' && !input.value && host.values.length) { host.removeAt(host.values.length - 1); refocus(host); }
    });
  },

  update (host) { const input = host.part('input').node; if (input) input.readOnly = Boolean(host.getAttr('readonly')); },

  focus : host => host.part('input').node,
};
