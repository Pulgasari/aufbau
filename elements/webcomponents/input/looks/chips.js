import { attrs, html } from '../../../lib/html.js';
import { FRAME, icon } from './parts/field.js';

const options = host => html`${(host.suggestionList ?? []).map(text => html`<option value="${text}"></option>`)}`;


const refocus = host => queueMicrotask(() => host.part('input').focus());

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'multiple',

  css : `
    ${FRAME}
    [part~="box"] { flex-wrap: wrap; gap: --space(tiny); padding-block: --space(tiny); }

    [part~="chip"] {
      align-items   : center;
      background    : color-mix(in srgb, currentColor 12%, transparent);
      border-radius : --radius();
      display       : inline-flex;
      gap           : --space(tiny);
      padding       : --space(tiny);
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
    <input part="input" type="${host.valueType.input}" placeholder="${host.placeholder || 'add…'}" enterkeyhint="done" ${attrs({ list: 'suggestionList' in host && 'suggestions' })} />
    ${'suggestionList' in host ? html`<datalist id="suggestions">${options(host)}</datalist>` : ''}
  `,

  events (host, scope) {
    const add = input => { if (input.value.trim()) { host.add(input.value); refocus(host); } };

    scope.on('click', '[part~="remove"]', (event, button) => host.removeAt(Number(button.dataset.index)));

    // what a refused chip said goes once the text changes, suggest() is asked anew
    scope.$(host.root).on('input', async event => {
      const input = host.part('input').node;
      if (event.target !== input) return;
      input.setCustomValidity('');
      if (typeof host.suggest !== 'function') return;

      const text  = input.value;
      const found = await host.suggest(text);
      if (input.value !== text) return;   // typed on meanwhile
      host.suggested = Array.isArray(found) ? found.map(String) : [];
      const list = host.root.querySelector('datalist');
      if (list) list.innerHTML = String(options(host));
    });
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
