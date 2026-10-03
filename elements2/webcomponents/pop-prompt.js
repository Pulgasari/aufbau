import { html } from '../lib/html.js';
import PopModal from './pop-modal.js';

// a question in a modal: a message, maybe a text field, cancel and confirm.
// show() resolves with 'confirm' or 'cancel'. the static helpers do it in one line:
//   if (await PopPrompt.confirm('Datei löschen?', { confirm: 'Löschen' })) …
//   const name = await PopPrompt.prompt('Name?', 'unbenannt');
//   await PopPrompt.alert('Gespeichert.');
export default class PopPrompt extends PopModal {
  static parts = ['field', 'message'];

  static attr = {
    cancel  : 'Cancel',   // empty for an alert
    confirm : 'OK',
    field   : Boolean,    // a text field
    message : String,
    value   : String,     // the text field's start value
  };

  static styles = `
    [part~="message"] { margin-block: 0.75em; }
    [part~="field"]   { box-sizing: border-box; inline-size: 100%; }

    [part~="actions"] {
      display         : flex;
      gap             : var(--control-gap, 0.5em);
      justify-content : flex-end;
      margin-block    : 1em 0;
    }
  `;

  static async ask (message, options = {}) {
    const prompt = document.createElement('pop-prompt');
    for (const [name, value] of Object.entries({ message, ...options })) {
      if (value !== false && value != null) prompt.setAttribute(name, value === true ? '' : value);
    }
    document.body.append(prompt);

    const result = await prompt.show();
    const value  = prompt.$field.node?.value ?? null;
    prompt.remove();
    return { confirmed: result === 'confirm', value };
  }

  static async alert   (message, options)        { await this.ask(message, { cancel: '', ...options }); }
  static async confirm (message, options)        { return (await this.ask(message, options)).confirmed; }
  static async prompt  (message, value, options) {
    const { confirmed, value: text } = await this.ask(message, { field: true, value, ...options });
    return confirmed ? text : null;
  }

  // enter in the field confirms
  onConnected () {
    super.onConnected();
    this.on('keydown', '[part~="field"]', event => { if (event.key === 'Enter') { event.preventDefault(); this.close('confirm'); } });
  }

  renderBody () {
    const { cancel, confirm, field, message, value } = this.getAttr();
    return html`
      <p part="message">${message ?? ''}</p>
      <slot></slot>
      ${field && html`<input part="field" value="${value ?? ''}" autofocus>`}
      <form method="dialog" part="actions">
        ${cancel && html`<button value="cancel">${cancel}</button>`}
        <button value="confirm" ${field ? '' : 'autofocus'}>${confirm}</button>
      </form>
    `;
  }
}

PopPrompt.init();
