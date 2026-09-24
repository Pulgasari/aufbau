// <aufbau-button>
// the host IS the button. no inner <button>, so role, focus, keyboard
// activation and form submission are provided here instead of natively.

import { AufbauElement } from './core/index.js';
import { html, raw }     from './core/html.js';

export default class AufbauButton extends AufbauElement {
  static formAssociated = true;

  static internals = { role: 'button' };

  static attr = {
    disabled : Boolean,
    icon     : String,
    label    : String,
    text     : String,
    type     : { default: 'button', values: ['button', 'reset', 'submit'] },
    variant  : 'default',
  };

  static styles = `aufbau-button {
    align-items     : center;
    cursor          : pointer;
    display         : inline-flex;
    gap             : 0.5rem;
    justify-content : center;
    line-height     : 1.2;
    user-select     : none;

    &[disabled] { cursor: not-allowed; opacity: 0.5; }
  }`;

  get disabled ()     { return this.hasAttribute('disabled'); }
  set disabled (next) { this.toggleAttribute('disabled', Boolean(next)); }
  get form     ()     { return this.internals?.form ?? null; }

  onMount () {
    // authored children are the content when no label/text is given.
    // captured before the first render replaces them
    this._children ??= this.innerHTML.trim();
    if (!this.internals) this.setAttribute('role', 'button');

    // capture phase: runs before any bubble listener on the host, also for clicks on children
    this.on('click', event => {
      if (this.disabled) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, { capture: true });

    this.on('click', event => {
      if (event.defaultPrevented || !this.form) return;
      const type = this.getAttr('type');
      if (type === 'submit') this.form.requestSubmit();
      if (type === 'reset')  this.form.reset();
    });

    // native timing: enter activates on keydown, space on keyup
    this.on('keydown', event => {
      if (event.target !== this) return;
      if (event.key === 'Enter') { event.preventDefault(); this.click(); }
      if (event.key === ' ')     event.preventDefault();
    });

    this.on('keyup', event => {
      if (event.target === this && event.key === ' ') this.click();
    });
  }

  render () {
    const { icon, label, text } = this.getAttr();
    const content = label || text;

    // attribute text is escaped. authored children are page markup and pass through unescaped
    return html`
      ${icon && html`<aufbau-icon icon="${icon}"></aufbau-icon>`}
      ${(content || this._children) && html`<span>${content || raw(this._children)}</span>`}
    `;
  }

  // kept out of render() so toggling disabled does not rebuild the markup
  sync () {
    const disabled = this.disabled;
    if (this.internals) this.internals.ariaDisabled = String(disabled);
    else this.setAttribute('aria-disabled', String(disabled));
    this.tabIndex = disabled ? -1 : 0;
  }
}

AufbauButton.init();
