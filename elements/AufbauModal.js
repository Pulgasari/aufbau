// <aufbau-modal>
// a modal dialog on a native <dialog>: top layer, inert page behind it, focus
// kept inside and restored afterwards all come from showModal(). the host
// creates the dialog once and moves the authored children into it.
//
//   <aufbau-modal heading="Löschen?">
//     <dialog aria-label="Löschen?">
//       <header><strong>Löschen?</strong><button aria-label="close">…</button></header>
//       …authored content…
//     </dialog>
//   </aufbau-modal>
//
// `open` mirrors the dialog in both directions. a <form method="dialog"> inside
// closes it natively, the submitter's value becomes the return value.
// show() resolves with that return value once the modal is closed again.

import { AufbauElement } from './core/index.js';
import { setAttr }       from '@domina/methods/setAttr.js';

export default class AufbauModal extends AufbauElement {
  static attr = {
    // close button, escape and a click on the backdrop close the modal
    dismissible : { type: Boolean, default: true },
    heading     : String,
    open        : Boolean,
  };

  // the host takes no part in layout, the dialog lives in the top layer.
  // opening and closing fade through @starting-style, display and overlay are
  // transitioned discretely so the exit animation gets to run
  static styles = `
    aufbau-modal {
      display: contents;

      > dialog {
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

        > header {
          align-items     : center;
          display         : flex;
          gap             : var(--aufbau-control-gap, 0.5em);
          justify-content : space-between;

          > strong { font-weight: 600; }

          > button {
            align-items       : center;
            background        : none;
            border            : 0;
            color             : inherit;
            cursor            : pointer;
            display           : inline-flex;
            font              : inherit;
            margin            : 0 0 0 auto;
            padding           : 0;
          }
        }
      }
    }

    /* no page scrolling behind an open modal */
    :root:has(aufbau-modal > dialog:modal) { overflow: hidden; }

    @media (prefers-reduced-motion: reduce) {
      aufbau-modal > dialog { --modal-duration: 0s; }
    }
  `;

  // :::::: IMPERATIVE API ::::::::::::::::::::::::::::::::::::::

  /**
   * a one-off confirmation. resolves true for the confirming button, false for
   * everything else (cancel, escape, backdrop). the modal removes itself.
   */
  static async confirm (message, { cancel = 'Cancel', confirm = 'OK', heading } = {}) {
    const modal = document.createElement('aufbau-modal');
    if (heading) modal.setAttribute('heading', heading);

    const text = Object.assign(document.createElement('p'), { textContent: message });
    const form = Object.assign(document.createElement('form'), { method: 'dialog' });
    form.append(
      Object.assign(document.createElement('button'), { textContent: cancel,  value: 'cancel' }),
      Object.assign(document.createElement('button'), { textContent: confirm, value: 'confirm', autofocus: true }),
    );
    modal.append(text, form);
    document.body.append(modal);

    const result = await modal.show();
    modal.remove();
    return result === 'confirm';
  }

  get dialog () { return this._dialog; }
  get isOpen () { return Boolean(this._dialog?.open); }

  /** opens the modal, resolves with the dialog's return value once it closes */
  show () {
    this._closed ??= new Promise(resolve => { this._resolve = resolve; });
    this.setAttr({ open: true });
    return this._closed;
  }

  close (returnValue) {
    if (this.isOpen) this._dialog.close(returnValue);
    return this;
  }

  toggle () { return this.isOpen ? this.close() : this.show(); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    this.build();
    const dialog = this._dialog;

    this.on('click', ':scope > dialog > header > button', () => this.close());

    // a click whose target is the dialog itself landed on the backdrop, content always sits in children
    this.on(dialog, 'click', (event) => {
      if (event.target === dialog && this.getAttr('dismissible')) this.close();
    });

    // escape arrives as a cancel, a non dismissible modal refuses it
    this.on(dialog, 'cancel', (event) => {
      if (!this.getAttr('dismissible')) event.preventDefault();
    });

    this.on(dialog, 'close', () => {
      if (this.getAttr('open')) this.setAttr({ open: false });
      this.emit('aufbau-modal', { open: false, returnValue: dialog.returnValue });
      this._resolve?.(dialog.returnValue);
      this._closed = this._resolve = null;
    });
  }

  // the dialog and its header are created once, the authored children move in and stay the same nodes
  build () {
    if (!this._dialog) {
      this._dialog = document.createElement('dialog');
      this._header = document.createElement('header');
      this._title  = document.createElement('strong');

      const close = setAttr(document.createElement('button'), { ariaLabel: 'close', type: 'button' });
      close.append(setAttr(document.createElement('aufbau-icon'), { icon: 'lucide:x' }));
      this._header.append(this._title, close);
    }

    const content = [...this.childNodes].filter(node => node !== this._dialog);
    this._dialog.append(...content);
    if (this._dialog.parentNode !== this) this.append(this._dialog);
  }

  render () { return null; }

  sync () {
    const dialog = this._dialog;
    if (!dialog) return;

    const { dismissible, heading, open } = this.getAttr();

    // the header only exists when it has something to carry
    this._title.textContent = heading ?? '';
    this._title.hidden      = !heading;
    this._header.querySelector('button').hidden = !dismissible;

    if (heading || dismissible) { if (this._header.parentNode !== dialog) dialog.prepend(this._header); }
    else this._header.remove();

    setAttr(dialog, { ariaLabel: heading || false });

    if (open && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
      this.emit('aufbau-modal', { open: true });
    }
    if (!open && dialog.open) dialog.close();
  }
}

AufbauModal.init();
