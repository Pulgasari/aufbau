import { html }                                                      from '../../../lib/html.js';
import { FRAME, field, fieldEvents, firstField, icon, updateFields } from './parts/field.js';

export default {
  fits : shape => shape.kind === 'free' && shape.count === 'range',

  css : `
    ${FRAME}
    [part~="input"]     { flex: 1 1 auto; inline-size: 100%; }
    [part~="separator"] { flex: none; opacity: 0.65; }
  `,

  render : host => html`
    ${icon(host)}
    ${field(host, 0, { 'aria-label': 'from' })}
    <span part="separator">–</span>
    ${field(host, 1, { 'aria-label': 'to' })}
  `,

  events : fieldEvents,
  update : updateFields,
  focus  : firstField,
};
