// <aufbau-modal>
// a modal dialog on a native <dialog>: top layer, inert page behind it, focus
// kept inside and restored afterwards all come from showModal().
//
// the dialog lives in the shadow root, the children stay the author's and are
// projected into it. nothing is moved, so a framework can keep rendering them.
//
//   <aufbau-modal heading="Löschen?">       shadow: <dialog part="dialog">
//     …children…                                     <header part="header">
//   </aufbau-modal>                                    <strong part="heading"> <button part="close">
//                                                    <slot>
//
// `open` mirrors the dialog in both directions. show() resolves with the return
// value once the modal is closed again. a <form method="dialog"> among the
// children closes it with the submitter's value, like it would natively.
// parts: dialog, header, heading, close. state: :state(open)

import { AufbauElement }   from './core/index.js';
import { html }            from './core/html.js';
import { adoptBaseStyles } from './core/styles.js';

// page scroll lock. document level on purpose, the shadow root cannot reach :root
const PAGE_STYLES = `:root:has(aufbau-modal:state(open)) { overflow: hidden; }`;

export default class AufbauModal extends AufbauElement {
  static shadow = true;

  static attr = {
    // close button, escape and a click on the backdrop close the modal
    dismissible : { type: Boolean, default: true },
    heading     : String,
    open        : Boolean,
  };

  // opening and closing fade through @starting-style, display and overlay are
  // transitioned discretely so the exit animation gets to run
  static styles = `
    :host { display: contents; }

    dialog {
      --modal-duration: 0.2s;

      box-sizing      : border-box;
      max-block-size  : min(var(--modal-max-block-size, 85dvh), calc(100dvh - 2rem));
      max-inline-size : min(var(--modal-size, 32rem), calc(100vw - 2rem));
      opacity         : 0;
      translate       : 0 0.75rem;
      transition      :
        opacity   var(--modal-duration) ease,
        translate var(--modal-duration) ease,
        display   var(--modal-duration) allow-discrete,
        overlay   var(--modal-duration) allow-discrete;

      &[open] {
        opacity   : 1;
        translate : 0 0;

        @starting-style { opacity: 0; translate: 0 0.75rem; }
      }

      &::backdrop {
        background-color : transparent;
        transition       :
          background-color var(--modal-duration) ease,
          display          var(--modal-duration) allow-discrete,
          overlay          var(--modal-duration) allow-discrete;
      }

      &[open]::backdrop {
        background-color: var(--modal-backdrop, rgb(0 0 0 / 0.45));

        @starting-style { background-color: transparent; }
      }
    }

    header {
      align-items     : center;
      display         : flex;
      gap             : var(--aufbau-control-gap, 0.5em);
      justify-content : space-between;

      > strong { font-weight: 600; }

      > button {
        align-items : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        font        : inherit;
        margin      : 0 0 0 auto;
        padding     : 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog { --modal-duration: 0s; }
    }
  `;


  // :::::: IMPERATIVE API ::::::::::::::::::::::::::::::::::::::

  /**
   * a one-off confirmation. resolves true for the confirming button, false for
   * everything else (cancel, escape, backdrop). the modal removes itself.
   */
  static async confirm (message, { cancel = 'Cancel', confirm = 'OK', heading } = {}) {
    const modal  = document.createElement('aufbau-modal');
    const text   = Object.assign(document.createElement('p'), { textContent: message });
    const form   = Object.assign(document.createElement('form'), { method: 'dialog' });
    const button = (label, value) => Object.assign(document.createElement('button'), { textContent: label, value });

    if (heading) modal.setAttribute('heading', heading);
    form.append(button(cancel, 'cancel'), Object.assign(button(confirm, 'confirm'), { autofocus: true }));
    modal.append(text, form);
    document.body.append(modal);

    const result = await modal.show();
    modal.remove();
    return result === 'confirm';
  }

  get dialog () { return this.$('dialog'); }
  get isOpen () { return Boolean(this.dialog?.open); }

  /** opens the modal, resolves with the dialog's return value once it closes */
  show () {
    this._closed ??= new Promise(resolve => { this._resolve = resolve; });
    this.setAttr({ open: true });
    return this._closed;
  }

  close (returnValue) {
    if (this.isOpen) this.dialog.close(returnValue);
    return this;
  }

  toggle () { return this.isOpen ? this.close() : this.show(); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    adoptBaseStyles('aufbau-modal-page', PAGE_STYLES);   // deduplicated by key

    this.on('click', '[part~="close"]', () => this.close());

    // a click whose target is the dialog itself landed on the backdrop, content always sits in children
    this.on(this.root, 'click', (event) => {
      if (event.target === this.dialog && this.getAttr('dismissible')) this.close();
    });

    // method="dialog" only closes a dialog that is a dom ancestor of the form.
    // the children are projected, not contained, so the host does it instead
    this.on('submit', (event) => {
      if (event.target.getAttribute('method')?.toLowerCase() !== 'dialog') return;
      event.preventDefault();
      this.close(event.submitter?.value ?? '');
    });

    // escape arrives as a cancel, a non dismissible modal refuses it
    this.on(this.root, 'cancel', (event) => {
      if (!this.getAttr('dismissible')) event.preventDefault();
    }, { capture: true });

    this.on(this.root, 'close', () => {
      const returnValue = this.dialog.returnValue;
      this.states.delete('open');
      if (this.getAttr('open')) this.setAttr({ open: false });
      this.emit('aufbau-modal', { open: false, returnValue });
      this._resolve?.(returnValue);
      this._closed = this._resolve = null;
    }, { capture: true });
  }

  // structure only, the dialog must survive open/close, so nothing here depends on `open`
  render () {
    return html`
      <dialog part="dialog">
        <header part="header">
          <strong part="heading"></strong>
          <button type="button" part="close" aria-label="close"><aufbau-icon icon="lucide:x"></aufbau-icon></button>
        </header>
        <slot></slot>
      </dialog>
    `;
  }

  sync () {
    const dialog = this.dialog;
    if (!dialog) return;

    const { dismissible, heading, open } = this.getAttr();
    const header = this.$('header');

    this.$('strong').textContent = heading ?? '';
    this.$('strong').hidden      = !heading;
    this.$('[part~="close"]').hidden = !dismissible;
    header.hidden = !heading && !dismissible;

    if (heading) dialog.setAttribute('aria-label', heading);
    else dialog.removeAttribute('aria-label');

    if (open && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
      this.states.add('open');
      this.emit('aufbau-modal', { open: true });
    }
    if (!open && dialog.open) dialog.close();
  }
}

AufbauModal.init();
