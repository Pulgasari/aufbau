import { Btn }  from './btn/Btn.js';
import { html } from '../lib/html.js';

// a compact pill: a filter, a tag, a choice. `pressed` marks it as on, `removable`
// adds an x at the end that removes it, delete and backspace do the same.
// a removal fires a cancelable remove event first; when nothing cancels it, the
// chip takes itself out of the dom and hands the focus on to a neighbour. a chip
// a framework renders cancels the event and drops the chip from its state
export default class BtnChip extends Btn {
  static reflect = ['pressed', 'removable'];

  static attr = {
    pressed   : Boolean,
    removable : Boolean,
  };

  static styles = `
    :host {
      border      : 1px solid color-mix(in oklab, currentColor 25%, transparent);
      font-size   : 0.875em;
      padding     : var(--btn-padding, 0.25em 0.75em);
      --btn-radius: 999px;
    }

    :host([pressed]) {
      --btn-background : color-mix(in oklab, currentColor 15%, transparent);
      background-color : var(--btn-background);
      border-color     : currentColor;
    }

    :host([removable]) { padding-inline-end: 0.3em; }

    [part="remove"] {
      border-radius : 50%;
      display       : inline-flex;
      opacity       : 0.6;
      padding       : 0.15em;

      &:hover { background-color: color-mix(in oklab, currentColor 15%, transparent); opacity: 1; }
    }
  `;

  get pressed ()      { return this.hasAttribute('pressed'); }
  set pressed (value) { this.toggleAttribute('pressed', Boolean(value)); }

  get removable ()      { return this.hasAttribute('removable'); }
  set removable (value) { this.toggleAttribute('removable', Boolean(value)); }

  // fires remove, then leaves the dom unless that was cancelled. true when it left
  dismiss () {
    if (!this.dispatchEvent(new CustomEvent('remove', { bubbles: true, cancelable: true }))) return false;

    const next = [this.nextElementSibling, this.previousElementSibling].find(node => node?.localName === this.localName);
    const had  = this.matches(':focus');
    this.remove();
    if (had) next?.focus();
    return true;
  }

  onConnected () {
    super.onConnected();

    // ahead of the button's own click: the x removes, it does not press
    this.on('click', event => {
      if (!this.removable || !event.composedPath().some(node => node.matches?.('[part~="remove"]'))) return;
      event.stopImmediatePropagation();
      this.dismiss();
    }, { capture: true });

    this.on('keydown', event => {
      if (event.target === this && this.removable && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        this.dismiss();
      }
    });
  }

  render () {
    return html`${super.render()}${this.removable && html`<span part="remove" aria-hidden="true"><svg-icon icon="close"></svg-icon></span>`}`;
  }

  sync () {
    super.sync();
    if (this.internals) this.internals.ariaPressed = this.hasAttribute('pressed') ? 'true' : null;
  }
}

BtnChip.init();
