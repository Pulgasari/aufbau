import { isPlainObject, isString } from '@pulgasari/is';
import { createShift, shift }      from '@pulgasari/shift';
import { setAttr }                 from '@domina/methods/setAttr.js';

import { adoptBaseStyles, AufbauElement } from '@aufbau/element';
import { html }                           from '../lib/html.js';

const ICONS = {
  error   : 'lucide:alert-circle',
  info    : 'lucide:info',
  success : 'lucide:check-circle-2',
  warning : 'lucide:alert-triangle',
};

// shorthand keys of notify({ error: … }), first match wins
const LEVELS = ['error', 'warning', 'warn', 'success', 'info'];

const SWIPE_RATIO = 0.35;

const isErrorLike = value =>
  value instanceof Error || (value != null && typeof value === 'object' && isString(value.message) && ('stack' in value || 'name' in value));

const messageOf = createShift(shift.predicates).with({ isErrorLike })({
  nullish   : '',
  string    : message => message,
  errorLike : error   => error.message,
  fallback  : String,
});

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

const STACK_STYLES = `
  [data-pop-toasts] {
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
    z-index         : var(--toast-z, 100);
  }
`;

export default class PopToast extends AufbauElement {
  static attr = {
    dismissible : Boolean,
    duration    : 4000,
    heading     : String,
    icon        : String,
    message     : String,
    type        : { default: 'info', values: ['error', 'info', 'success', 'warning'] },
  };

  static shadow = true;

  static styles = `
    :host {
      align-items           : start;
      column-gap            : var(--control-gap, 0.5em);
      display               : grid;
      grid-template-columns : auto 1fr auto;
      pointer-events        : auto;
    }

    :host([dismissible]) { touch-action: pan-y; }

    [part~="icon"] { grid-row: span 2; line-height: 1.4; }

    [part~="heading"],
    [part~="message"] {
      grid-column     : 2;
      min-inline-size : 0;
      overflow-wrap   : anywhere;
    }

    [part~="heading"] { font-weight: 600; }

    [part~="close"] {
      align-items : center;
      background  : none;
      border      : 0;
      color       : inherit;
      cursor      : pointer;
      display     : inline-flex;
      font        : inherit;
      margin      : 0;
      padding     : 0;
      grid-column : 3;
      grid-row    : 1 / span 2;
    }
  `;

  // :::::: IMPERATIVE API ::::::::::::::::::::::::::::::::::::::

  static get stack () {
    let stack = document.querySelector('[data-pop-toasts]');
    if (!stack) {
      stack = document.createElement('section');
      setAttr(stack, { ariaLive: 'polite', dataPopToasts: true, popover: 'manual' });
      document.body.append(stack);
    }
    return stack;
  }

  static notify (input, options) {
    const { dismissible = true, duration, heading, icon, message, title, type } = toToastOptions(input, options);
    const toast = document.createElement('pop-toast');
    const stack = this.stack;

    setAttr(toast, { dismissible, duration, heading: heading ?? title, icon, message, type });
    stack.append(toast);

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

  onConnected () {
    adoptBaseStyles('pop-toast-stack', STACK_STYLES);   // deduplicated by key

    this.on('click', '[part~="close"]', () => this.dismiss());

    // hovering or focusing a toast holds its countdown
    this.on('pointerenter', () => this.stopTimer());
    this.on('pointerleave', () => this.startTimer());
    this.on('focusin',      () => this.stopTimer());
    this.on('focusout',     () => this.startTimer());

    this.onSwipe();
    this.startTimer();
  }

  onDisconnected () { this.stopTimer(); }

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

  dismiss (direction = 1) {
    if (this._dismissing) return this;
    this._dismissing = true;
    this.stopTimer();
    this.emit('pop-toast-dismiss');

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

  onSwipe () {
    let origin = null;
    let offset = 0;

    this.on('pointerdown', (event) => {
      if (!this.getAttr('dismissible') || event.pointerType === 'mouse') return;
      if (event.composedPath().some(node => node.localName === 'button')) return;   // retargeted, the path still knows
      if (this.getAttr('gestures') === 'false') return;
      origin = event.clientX;
      offset = 0;
      this.stopTimer();
    });

    this.$(window).on('pointermove', event => {
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

    this.$(window).on('pointerup pointercancel', release);
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  render () {
    const { dismissible, heading, icon, message, type } = this.getAttr();

    // the message attribute wins, otherwise the children show
    return html`
      <svg-icon part="icon" icon="${icon || ICONS[type] || ICONS.info}"></svg-icon>
      ${heading && html`<strong part="heading">${heading}</strong>`}
      <div part="message">${message || html`<slot></slot>`}</div>
      ${dismissible && html`<button type="button" part="close" aria-label="close"><svg-icon icon="lucide:x"></svg-icon></button>`}
    `;
  }

  sync () {
    const role = this.getAttr('type') === 'error' ? 'alert' : 'status';
    if (this.internals) this.internals.role = role;
    else this.setAttribute('role', role);
  }
}

export const notify = (input, options) => PopToast.notify(input, options);

PopToast.init();
