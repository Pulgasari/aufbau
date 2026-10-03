// look="field": one typed value. the icon, the text, the actions (copy, paste, clear, reveal)
// parts: box, icon, input, action

import { actionButtons, bindActions, parseActions }               from '../../lib/actions.js';
import { html }                                                   from '../../lib/html.js';
import { FRAME, field, fieldEvents, firstField, icon, updateFields } from './parts/field.js';

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'single',

  css : `
    ${FRAME}
    [part~="input"] { flex: 1 1 auto; inline-size: 100%; }
  `,

  render : host => html`
    ${icon(host)}
    ${field(host)}
    ${actionButtons(parseActions(host.actions))}
  `,

  events (host, on) {
    fieldEvents(host, on);
    bindActions(host, on);
  },

  update (host) {
    updateFields(host);
    const clear = host.root.querySelector('[data-action="clear"]');
    if (clear) clear.hidden = !host.value;
  },

  focus : firstField,
};
