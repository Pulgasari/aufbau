import { adoptBaseStyles, AufbauElement } from '@aufbau/element';
import { html }                           from '../lib/html.js';

const PAGE_STYLES = `:root:has(app-modal:state(open)) { overflow: hidden; }`;

export default class AppModal extends AufbauElement {
  static shadow = true;
  static parts  = ['close', 'dialog', 'header', 'heading'];

  static attr = {
    dismissible : { type: Boolean, default: true },
    heading     : String,
    open        : Boolean,
  };

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

  static async confirm (message, { cancel = 'Cancel', confirm = 'OK', heading } = {}) {
    const modal  = document.createElement('app-modal');
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

  get dialog () { return this.$dialog.node; }
  get isOpen () { return Boolean(this.dialog?.open); }

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

  onConnected () {
    adoptBaseStyles('app-modal-page', PAGE_STYLES);   // deduplicated by key

    this.$close.onClick(() => this.close());

    // a click on the backdrop lands on the dialog itself
    this.$dialog.onClick(event => { if (event.target === this.dialog && this.getAttr('dismissible')) this.close(); });

    this.on('submit', (event) => {
      if (event.target.getAttribute('method')?.toLowerCase() !== 'dialog') return;
      event.preventDefault();
      this.close(event.submitter?.value ?? '');
    });

    this.$dialog.on('cancel', event => { if (!this.getAttr('dismissible')) event.preventDefault(); });

    this.$dialog.on('close', () => {
      const returnValue = this.dialog.returnValue;
      this.states.delete('open');
      if (this.getAttr('open')) this.setAttr({ open: false });
      this.emit('app-modal', { open: false, returnValue });
      this._resolve?.(returnValue);
      this._closed = this._resolve = null;
    });
  }

  render () {
    return html`
      <dialog part="dialog">
        <header part="header">
          <strong part="heading"></strong>
          <button type="button" part="close" aria-label="close"><svg-icon icon="lucide:x"></svg-icon></button>
        </header>
        <slot></slot>
      </dialog>
    `;
  }

  sync () {
    const dialog = this.dialog;
    if (!dialog) return;

    const { dismissible, heading, open } = this.getAttr();
    this.$heading.text(heading ?? '').attr({ hidden: !heading });
    this.$close.attr({ hidden: !dismissible });
    this.$header.attr({ hidden: !heading && !dismissible });

    if (heading) dialog.setAttribute('aria-label', heading);
    else dialog.removeAttribute('aria-label');

    if (open && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
      this.states.add('open');
      this.emit('app-modal', { open: true });
    }
    if (!open && dialog.open) dialog.close();
  }
}

AppModal.init();
