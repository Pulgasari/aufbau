// <aufbau-toast>
// the host is the toast. icon, heading, message and close button are direct
// children, laid out by a grid on the host. notify() is the imperative entry.

import { isPlainObject, isString } from '@pulgasari/is';
import { setAttr }                 from '@domina/methods/setAttr.js';

import { AufbauElement } from './core/index.js';
import { html, raw }     from './core/html.js';

const ICONS = {
  error   : 'lucide:alert-circle',
  info    : 'lucide:info',
  success : 'lucide:check-circle-2',
  warning : 'lucide:alert-triangle',
};

// shorthand keys of notify({ error: … }), first match wins
const LEVELS = ['error', 'warning', 'warn', 'success', 'info'];

// a swipe beyond this share of the toast width dismisses it, anything less snaps back
const SWIPE_RATIO = 0.35;

// real errors, DOMExceptions and error shaped objects ({ name, message } from an api)
const isErrorLike = value =>
  value instanceof Error || (value != null && typeof value === 'object' && isString(value.message) && ('stack' in value || 'name' in value));

const messageOf = value =>
    value == null      ? ''
  : isString(value)    ? value
  : isErrorLike(value) ? value.message
  : String(value);

/**
 * every accepted notify() input -> one flat options object.
 *   notify('saved')
 *   notify(error)                        type error, message from the error
 *   notify({ error: 'failed' })          level key: type + message in one
 *   notify({ error, heading: 'upload' })
 *   notify({ type, heading, message, duration, dismissible, icon })
 */
export function toToastOptions (input, options = {}) {
  let result;

  if (isErrorLike(input))         result = { type: 'error', message: input, ...options };
  else if (!isPlainObject(input)) result = { message: input, ...options };
  else {
    const level = LEVELS.find(key => key in input);
    if (level) {
      const { [level]: value, ...rest } = input;
      result = { type: level, message: value, ...rest, ...options };
    }
    else result = { ...input, ...options };
  }

  result.message = messageOf(result.message);
  if (result.type === 'warn') result.type = 'warning';
  return result;
}

export default class AufbauToast extends AufbauElement {
  static attr = {
    dismissible : Boolean,
    duration    : 4000,
    heading     : String,
    icon        : String,
    message     : String,
    type        : { default: 'info', values: ['error', 'info', 'success', 'warning'] },
  };

  static styles = `
    [data-aufbau-toasts] {
      background      : none;
      border          : 0;
      display         : flex;
      flex-direction  : column;
      gap             : 0.5rem;
      inset           : 1rem 1rem auto auto;
      margin          : 0;
      max-inline-size : min(24rem, calc(100vw - 2rem));
      overflow        : visible;
      padding         : 0;
      pointer-events  : none;
      position        : fixed;
      z-index         : var(--aufbau-toast-z, 100);
    }

    aufbau-toast {
      align-items           : start;
      column-gap            : var(--aufbau-control-gap, 0.5em);
      display               : grid;
      grid-template-columns : auto 1fr auto;
      pointer-events        : auto;

      > aufbau-icon { grid-row: span 2; line-height: 1.4; }

      > :is(strong, div) {
        grid-column     : 2;
        min-inline-size : 0;
        overflow-wrap   : anywhere;
      }

      > strong { font-weight: 600; }

      > button {
        align-items : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        font        : inherit;
        grid-column : 3;
        grid-row    : 1 / span 2;
        margin      : 0;
        padding     : 0;
      }

      /* horizontal drags belong to the swipe, vertical ones still scroll the page */
      &[dismissible] { touch-action: pan-y; }
    }
  `;

  // :::::: IMPERATIVE API ::::::::::::::::::::::::::::::::::::::

  /** the shared stack. a manual popover, so toasts sit in the top layer above dialogs */
  static get stack () {
    let stack = document.querySelector('[data-aufbau-toasts]');
    if (!stack) {
      stack = document.createElement('section');
      setAttr(stack, { ariaLive: 'polite', dataAufbauToasts: true, popover: 'manual' });
      document.body.append(stack);
    }
    return stack;
  }

  static notify (input, options) {
    const { dismissible = true, duration, heading, icon, message, title, type } = toToastOptions(input, options);
    const toast = document.createElement('aufbau-toast');
    const stack = this.stack;

    setAttr(toast, { dismissible, duration, heading: heading ?? title, icon, message, type });
    stack.append(toast);

    // re-shown on every notify, the most recently shown top layer element is the topmost one
    if (stack.showPopover) {
      if (stack.matches(':popover-open')) stack.hidePopover();
      stack.showPopover();
    }

    return toast;
  }

  static error   (input, options) { return this.notify(input, { ...options, type: 'error'   }); }
  static info    (input, options) { return this.notify(input, { ...options, type: 'info'    }); }
  static success (input, options) { return this.notify(input, { ...options, type: 'success' }); }
  static warning (input, options) { return this.notify(input, { ...options, type: 'warning' }); }
  static warn    (input, options) { return this.warning(input, options); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  constructor () {
    super();
    this._internals = this.attachInternals?.() ?? null;
  }

  onMount () {
    // authored children are the message when no message attribute is given
    this._children ??= this.innerHTML.trim();

    this.on('click', 'button', () => this.dismiss());

    // hovering or focusing a toast holds its countdown
    this.on('pointerenter', () => this.stopTimer());
    this.on('pointerleave', () => this.startTimer());
    this.on('focusin',      () => this.stopTimer());
    this.on('focusout',     () => this.startTimer());

    this.onSwipe();
    this.startTimer();
  }

  onUnmount () { this.stopTimer(); }

  // :::::: TIMER :::::::::::::::::::::::::::::::::::::::::::::::

  startTimer () {
    this._remaining ??= this.getAttr('duration');
    if (this._timer || this._dismissing || !(this._remaining > 0)) return;

    this._started = Date.now();
    this._timer   = setTimeout(() => this.dismiss(), this._remaining);
  }

  stopTimer () {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer      = null;
    this._remaining -= Date.now() - this._started;
  }

  // :::::: DISMISS :::::::::::::::::::::::::::::::::::::::::::::

  /** slides out towards `direction` (1 = inline end, -1 = inline start), then leaves the dom */
  dismiss (direction = 1) {
    if (this._dismissing) return this;
    this._dismissing = true;
    this.stopTimer();
    this.emit('aufbau-toast-dismiss');

    const remove = () => this.remove();
    if (!this.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) { remove(); return this; }

    const from = this.style.translate || '0 0';
    this.style.translate = '';
    this.animate(
      [{ opacity: 1, translate: from }, { opacity: 0, translate: `${direction * 100}% 0` }],
      { duration: 200, easing: 'ease', fill: 'forwards' }
    ).finished.then(remove, remove);

    return this;
  }

  // touch and pen only. a mouse has the close button, and dragging would fight text selection
  onSwipe () {
    let origin = null;
    let offset = 0;

    this.on('pointerdown', (event) => {
      if (!this.getAttr('dismissible') || event.pointerType === 'mouse' || event.target.closest('button')) return;
      if (this.gesturesMode() === 'false') return;
      origin = event.clientX;
      offset = 0;
      this.stopTimer();
    });

    this.on(window, 'pointermove', (event) => {
      if (origin == null) return;
      offset = event.clientX - origin;
      this.style.translate = `${offset}px 0`;
      this.style.opacity   = String(1 - Math.min(Math.abs(offset) / this.offsetWidth, 1) * 0.6);
    }, { passive: true });

    const release = () => {
      if (origin == null) return;
      origin = null;
      this.style.opacity = '';

      if (Math.abs(offset) > this.offsetWidth * SWIPE_RATIO) { this.dismiss(Math.sign(offset)); return; }

      // snap back from where the finger let go
      this.style.translate = '';
      this.animate?.([{ translate: `${offset}px 0` }, { translate: '0 0' }], { duration: 150, easing: 'ease-out' });
      this.startTimer();
    };

    this.on(window, 'pointerup',     release);
    this.on(window, 'pointercancel', release);
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  render () {
    const { dismissible, heading, icon, message, type } = this.getAttr();

    // attribute text is escaped. authored children are page markup and pass through unescaped
    return html`
      <aufbau-icon icon="${icon || ICONS[type] || ICONS.info}"></aufbau-icon>
      ${heading && html`<strong>${heading}</strong>`}
      ${(message || this._children) && html`<div>${message || raw(this._children)}</div>`}
      ${dismissible && html`<button type="button" aria-label="close"><aufbau-icon icon="lucide:x"></aufbau-icon></button>`}
    `;
  }

  // errors interrupt, everything else waits for a pause in speech
  sync () {
    const role = this.getAttr('type') === 'error' ? 'alert' : 'status';
    if (this._internals) this._internals.role = role;
    else this.setAttribute('role', role);
  }
}

export const notify = (input, options) => AufbauToast.notify(input, options);

AufbauToast.init();
