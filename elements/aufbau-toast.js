import { AufbauElement } from './AufbauElement.js';

const TOAST_ICONS = {
  info: 'lucide:info',
  success: 'lucide:check-circle-2',
  warning: 'lucide:alert-triangle',
  error: 'lucide:alert-circle',
};

export class AufbauToast extends AufbauElement {
  static get observedAttributes() {
    return ['type', 'title', 'message', 'duration', 'dismissible'];
  }

  onMount() {
    const duration = parseInt(this.getAttribute('duration') || '4000', 10);
    
    // Auto-dismiss if duration > 0
    if (duration > 0) {
      this._timer = setTimeout(() => this.dismiss(), duration);
    }

    this.addEventListener('click', (e) => {
      if (e.target.closest('.toast-close')) {
        this.dismiss();
      }
    });
  }

  onUnmount() {
    if (this._timer) clearTimeout(this._timer);
  }

  dismiss() {
    this.classList.add('is-dismissing');
    this.emit('aufbau-toast-dismiss');
    
    // Remove element from DOM after transition
    setTimeout(() => {
      if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);
  }

  update() {
    const type = this.getAttribute('type') || 'info';
    const title = this.getAttribute('title') || '';
    const message = this.getAttribute('message') || this.innerHTML.trim();
    const icon = this.getAttribute('icon') || TOAST_ICONS[type] || TOAST_ICONS.info;
    const isDismissible = this.hasAttribute('dismissible');

    this.innerHTML = `
      <div class="aufbau-toast-wrapper type-${type}">
        <div class="toast-icon">
          <aufbau-icon icon="${icon}"></aufbau-icon>
        </div>
        <div class="toast-content">
          ${title ? `<div class="toast-title">${title}</div>` : ''}
          ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        ${isDismissible ? `
          <button type="button" class="toast-close" title="Close notification">
            <aufbau-icon icon="lucide:x"></aufbau-icon>
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Static helper method to create and trigger a toast programmatically
   */
  static notify(options = {}) {
    let container = document.querySelector('.aufbau-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'aufbau-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('aufbau-toast');
    if (options.type) toast.setAttribute('type', options.type);
    if (options.title) toast.setAttribute('title', options.title);
    if (options.message) toast.setAttribute('message', options.message);
    if (options.duration !== undefined) toast.setAttribute('duration', options.duration.toString());
    if (options.dismissible !== false) toast.setAttribute('dismissible', '');

    container.appendChild(toast);
    return toast;
  }
}

customElements.define('aufbau-toast', AufbauToast);
