// look="combobox": the host is a field, the options are in a popover below it.
// `searchable` filters them while typing. one value, or any number with `multiple`
// parts: box, icon, input, caret, listbox, option, label

import { attrs, html }                                                  from '../../lib/html.js';
import { FRAME, icon }                                                  from './parts/field.js';
import { labelOf, updateSelected }                                      from './parts/options.js';
import { LISTBOX, filter, isOpen, listbox, listboxOf, popoverEvents, setOpen, triggerOf } from './parts/popover.js';

/** the field shows the labels of the selection, never while it is typed in */
function showSelection (host) {
  const input = triggerOf(host);
  if (!input || input === host.focused) return;
  const selected = host.selected;
  input.value = host.options.filter(entry => selected.has(entry.value)).map(labelOf).join(', ');
}

export default {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    ${FRAME}
    ${LISTBOX}
    [part~="box"] { cursor: pointer; }

    [part~="input"] {
      cursor        : inherit;
      flex          : 1 1 auto;
      inline-size   : 100%;
      text-overflow : ellipsis;

      &[aria-expanded="true"] ~ [part~="caret"] { rotate: 180deg; }
    }

    [part~="caret"] { opacity: 0.65; transition: rotate 0.15s ease; }
  `,

  render : host => html`
    ${icon(host)}
    <input type="text" part="input" role="combobox" aria-haspopup="listbox" aria-expanded="false"
           ${attrs({ placeholder: host.placeholder || 'select…', readonly: !host.getAttr('searchable') })} />
    <svg-icon part="caret" icon="lucide:chevron-down"></svg-icon>
    ${listbox(host)}
  `,

  events (host, on) {
    popoverEvents(host, on, () => host);

    // a click anywhere on the field opens or closes the list, a click in the list is an option
    on('click', event => {
      if (!event.composedPath().includes(listboxOf(host))) setOpen(host, !isOpen(host), host);
    });

    on(host.root, 'input', event => {
      if (event.target !== triggerOf(host)) return;
      setOpen(host, true, host);
      filter(host, event.target.value);
    });

    // the search text is no value, the field shows the selection again once it is left
    on(host.root, 'focusout', event => { if (event.target === triggerOf(host) && !isOpen(host)) showSelection(host); });
  },

  update (host) {
    updateSelected(host);
    showSelection(host);
  },

  focus : triggerOf,
};
