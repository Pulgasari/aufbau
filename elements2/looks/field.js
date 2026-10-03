// @aufbau/elements2/looks/field.js
// typed values. parts: icon, input, separator, action, button (decrement, increment)
//
//   field    one value: the icon, the text, the actions
//   fields   two values, from and to
//   stepper  one value between a minus and a plus button

import { actionButtons, parseActions } from '../core/actions.js';
import { attrs, html }                 from '../core/html.js';

// the numeric types a button can step, color moves along an axis but not by a step
const STEPPABLE = new Set(['date', 'datetime', 'duration', 'number', 'time', 'year']);

export const BOX = `
  border         : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius  : var(--radius-control, 0.4em);
  min-block-size : var(--control-size, 2.25em);
  padding-inline : 0.6em;
`;

export const iconOf = host => {
  const icon = host.getAttr('icon');
  return icon === 'false' ? null : icon || host.valueType.icon || host.listType?.icon || null;
};

export const iconPart = host => {
  const icon = iconOf(host);
  return icon && html`<svg-icon part="icon" icon="${icon}"></svg-icon>`;
};

/** the native field of the value at `index`. value and readonly are applied in sync, a rebuild would drop the caret */
export function inputPart (host, index = 0, extra = {}) {
  const { autocomplete, max, maxlength, min, minlength, pattern, placeholder, step } = host.getAttr();
  return html`<input part="input" data-index="${index}" ${attrs({ autocomplete, max, maxlength, min, minlength, pattern, placeholder, step, type: host.valueType.input, ...extra })} />`;
}

/** writes the values into the fields, never into the one being typed in */
export function syncInputs (host) {
  const values   = host.values;
  const readonly = Boolean(host.getAttr('readonly'));

  for (const input of host.root.querySelectorAll('input[data-index]')) {
    input.readOnly = readonly;
    if (input === host.focused) continue;
    const value = values[Number(input.dataset.index)] ?? '';
    if (input.value !== value) input.value = value;
  }

  const clear = host.root.querySelector('[data-action="clear"]');
  if (clear) clear.hidden = !host.getAttribute('value');
}

export const field = {
  fits : shape => shape.kind === 'free' && shape.count === 'single',

  styles : `
    :host(:is([look="field"], [look="fields"], [look="stepper"])) [part~="box"] { ${BOX} }

    :host(:is([look="field"], [look="fields"], [look="stepper"])) [part~="box"]:focus-within {
      border-color: var(--color-ink, Highlight);
    }

    :host(:is([look="field"], [look="fields"])) [part~="input"] { flex: 1 1 auto; inline-size: 100%; }
  `,

  render : host => html`
    ${iconPart(host)}
    ${inputPart(host)}
    ${actionButtons(parseActions(host.actions))}
  `,

  sync : syncInputs,
};

export const fields = {
  fits : shape => shape.kind === 'free' && shape.count === 'range',

  styles : `
    :host([look="fields"]) [part~="separator"] { flex: none; opacity: 0.65; }
  `,

  render : host => html`
    ${iconPart(host)}
    ${inputPart(host, 0, { 'aria-label': 'from' })}
    <span part="separator">–</span>
    ${inputPart(host, 1, { 'aria-label': 'to' })}
  `,

  sync : syncInputs,
};

export const stepper = {
  fits : shape => shape.kind === 'free' && shape.count === 'single' && STEPPABLE.has(shape.type),

  styles : `
    :host([look="stepper"]) [part~="box"] { padding-inline: 0.25em; }

    :host([look="stepper"]) [part~="input"] {
      appearance  : textfield;
      flex        : 1 1 auto;
      inline-size : 100%;
      text-align  : center;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button { appearance: none; margin: 0; }
    }

    :host([look="stepper"]) [part~="button"] {
      block-size    : 1.75em;
      border-radius : var(--radius-control, 0.4em);
      inline-size   : 1.75em;

      &:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
    }
  `,

  render : host => html`
    <button type="button" part="button decrement" data-step="-1" aria-label="less" tabindex="-1"><svg-icon icon="lucide:minus"></svg-icon></button>
    ${inputPart(host)}
    <button type="button" part="button increment" data-step="1" aria-label="more" tabindex="-1"><svg-icon icon="lucide:plus"></svg-icon></button>
  `,

  sync : syncInputs,

  // the arrow keys step like on a native number field, for every steppable type
  bind (host, on) {
    on(host.root, 'keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      host.stepBy(event.key === 'ArrowUp' ? 1 : -1);
    });
  },

  focusTarget : host => host.root.querySelector('[part~="input"]'),
};
