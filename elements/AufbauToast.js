// <aufbau-toast>

import { AufbauElement } from './core/index.js';

const TOAST_ICONS = {
  info    : 'lucide:info',
  success : 'lucide:check-circle-2',
  warning : 'lucide:alert-triangle',
  error   : 'lucide:alert-circle',
};

export default class AufbauToast extends AufbauElement {
  static attr = {
    type        : 'info',
    title       : String,
    message     : String,
    duration    : 4000,
    dismissible : Boolean,
    icon        : String
  };

  // the container is created by notify() and stacks the toasts over the page,
  // so it is structure rather than decoration
  static styles = `
    .aufbau-toast-container {
      position: fixed;
      inset-block-start: 1rem;
      inset-inline-end: 1rem;
      z-index: var(--aufbau-toast-z, 100);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-inline-size: min(24rem, calc(100vw - 2rem));
      pointer-events: none;
    }

    aufbau-toast {
      display: block;
      pointer-events: auto;
      transition: opacity 0.2s ease, translate 0.2s ease;
    }

    aufbau-toast.is-dismissing {
      opacity: 0;
      translate: 100% 0;
    }

    aufbau-toast .aufbau-toast-wrapper {
      display: flex;
      align-items: flex-start;
      gap: var(--aufbau-control-gap, 0.5em);
    }

    aufbau-toast .toast-icon    { flex: none; line-height: 1.4; }
    aufbau-toast .toast-content { flex: 1 1 auto; min-inline-size: 0; }
    aufbau-toast .toast-title   { font-weight: 600; }
    aufbau-toast .toast-message { overflow-wrap: anywhere; }

    aufbau-toast .toast-close {
      display: inline-flex;
      align-items: center;
      flex: none;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
  `;

  onMount () {
    const { duration } = this.getAttr();

    if (duration > 0) {
      this._timer = setTimeout(() => this.dismiss(), duration);
    }

    this.on('click', (e) => {
      if (e.target.closest('.toast-close')) {
        this.dismiss();
      }
    });
  }

  onUnmount () {
    if (this._timer) clearTimeout(this._timer);
  }

  dismiss () {
    this.classList.add('is-dismissing');
    this.emit('aufbau-toast-dismiss');

    setTimeout(() => {
      if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);
  }

  update () {
    const { type, title, dismissible, icon: customIcon } = this.getAttr();
    const message = this.getAttr('message') || this.innerHTML.trim();
    const icon    = customIcon || TOAST_ICONS[type] || TOAST_ICONS.info;

    //const { dismissible, icon, message, title, type } = this.getAttr();
    //message ||= this.innerHTML.trim();
    //icon    ||= TOAST_ICONS[type] || TOAST_ICONS.info;

    this.innerHTML = `
      <div class="aufbau-toast-wrapper type-${type}">
        <div class="toast-icon">
          <aufbau-icon icon="${icon}"></aufbau-icon>
        </div>
        <div class="toast-content">
          ${title   ? `<div class="toast-title">${title}</div>`     : ''}
          ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        ${dismissible ? `
          <button type="button" class="toast-close" title="Close notification">
            <aufbau-icon icon="lucide:x"></aufbau-icon>
          </button>
        ` : ''}
      </div>
    `;
  }

  static notify (options = {}) {
    let container = document.querySelector('.aufbau-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'aufbau-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('aufbau-toast');
    if (options.type)                   toast.setAttribute('type', options.type);
    if (options.title)                  toast.setAttribute('title', options.title);
    if (options.message)                toast.setAttribute('message', options.message);
    if (options.duration !== undefined) toast.setAttribute('duration', options.duration.toString());
    if (options.dismissible !== false)  toast.setAttribute('dismissible', '');
    container.appendChild(toast);
    
    return toast;
  }
}

AufbauToast.init();
