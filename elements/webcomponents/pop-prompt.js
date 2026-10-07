import './input/tags.js';
import './input-option.js';

import { attrs, html } from '../lib/html.js';
import PopModal        from './pop-modal.js';

// a question in a modal: a message, maybe a field, cancel and confirm. the field is an
// input-value of any type: field="date", field="language", field with options …
// show() resolves with 'confirm' or 'cancel'. the static helpers do it in one line:
//   if (await PopPrompt.confirm('Datei löschen?', { confirm: 'Löschen' })) …
//   const name = await PopPrompt.prompt('Name?', 'unbenannt');
//   const day  = await PopPrompt.prompt('Wann?', '', { field: 'date' });
//   const size = await PopPrompt.prompt('Größe?', 'm', { options: ['s', 'm', 'l'], look: 'segments' });
//   await PopPrompt.alert('Gespeichert.');
export default class PopPrompt extends PopModal {
  static parts = ['field', 'message'];

  static attr = {
    cancel  : 'Cancel',   // empty for an alert
    confirm : 'OK',
    field   : String,     // the type of the field, text when empty
    look    : String,     // the look of the field
    message : String,
    value   : String,     // the field's start value
  };

  static styles = `
    [part~="message"] { margin-block: 0.75em; }
    [part~="field"]   { box-sizing: border-box; inline-size: 100%; }

    [part~="actions"] {
      display         : flex;
      gap             : --space(small);
      justify-content : flex-end;
      margin-block    : 1em 0;
    }
  `;

  // options: the attributes, and options as a list of values or { value, label }
  static async ask (message, { options, ...rest } = {}) {
    const prompt = document.createElement('pop-prompt');
    prompt.options = options;
    for (const [name, value] of Object.entries({ message, ...rest })) {
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
    const { confirmed, value: answer } = await this.ask(message, { field: true, value, ...options });
    return confirmed ? answer : null;
  }

  // enter in the field confirms
  onConnected () {
    super.onConnected();
    this.on('keydown', '[part~="field"]', event => { if (event.key === 'Enter') { event.preventDefault(); this.close('confirm'); } });
  }

  renderBody () {
    const { cancel, confirm, field, look, message, value } = this.getAttr();
    const type    = this.hasAttribute('field') ? field || 'text' : null;
    const options = (this.options ?? []).map(option => typeof option === 'object' ? option : { value: option });

    return html`
      <p part="message">${message ?? ''}</p>
      <slot></slot>
      ${type && html`
        <input-value part="field" ${attrs({ autofocus: true, look, type: !options.length && type, value })}>
          ${options.map(option => html`<input-option ${attrs({ value: option.value })}>${option.label ?? option.value}</input-option>`)}
        </input-value>
      `}
      <form method="dialog" part="actions">
        ${cancel && html`<button value="cancel">${cancel}</button>`}
        <button value="confirm" ${type ? '' : 'autofocus'}>${confirm}</button>
      </form>
    `;
  }
}

PopPrompt.init();
