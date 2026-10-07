import { attrs, html } from '../../../../lib/html.js';

// the frame of a field like look, on the part box
export const FRAME = `
  [part~="box"] {
    border         : var(--input-line);
    border-radius  : --radius();
    min-block-size : --space(9);
    padding-inline : --space(small);

    &:focus-within { border-color: var(--color-ink, Highlight); }
  }

  [part~="icon"], [part~="action"] { opacity: 0.65; }
  [part~="action"]:hover          { opacity: 1; }
`;

export const icon = host => host.iconName && html`<svg-icon part="icon" icon="${host.iconName}"></svg-icon>`;

export function field (host, index = 0, extra = {}) {
  const { autocomplete, max, maxlength, min, minlength, pattern, step } = host.getAttr();
  const placeholder = host.placeholder;
  return html`<input part="input" data-index="${index}" ${attrs({ autocomplete, max, maxlength, min, minlength, pattern, placeholder, step, type: host.valueType.input, ...extra })} />`;
}

export function fieldEvents (host, scope) {
  scope.on('input',  'input[data-index]', (event, input) => host.setPart(Number(input.dataset.index), input.value));
  scope.on('change', 'input[data-index]', (event, input) => host.setPart(Number(input.dataset.index), input.value, { final: true }));
}

export function updateFields (host) {
  const parts    = host.values;
  const readonly = Boolean(host.getAttr('readonly'));

  for (const input of host.root.querySelectorAll('input[data-index]')) {
    input.readOnly = readonly;
    if (input === host.focused) continue;
    const value = parts[Number(input.dataset.index)] ?? '';
    if (input.value !== value) input.value = value;
  }
}

export const firstField = host => host.root.querySelector('input[data-index]');
