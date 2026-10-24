import { Pop } from './pop/Pop.js';

// a hint for another element, shown while it is hovered or focused.
//   <button id="save">…</button> <pop-tip for="save">Speichern (strg+s)</pop-tip>
// without for, the element before it
export default class PopTip extends Pop {
  static popover = 'manual';

  static internals = { role: 'tooltip' };

  static attr = {
    delay     : { type: Number, default: 400 },
    for       : String,
    placement : { type: String, default: 'top-start', values: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  };

  static styles = `:host { pointer-events: none; }`;

  get target () {
    const selector = this.getAttr('for');
    if (!selector) return this.previousElementSibling;
    return document.getElementById(selector) ?? this.getRootNode().querySelector?.(selector) ?? null;
  }

  get anchorElement () { return this.target; }

  onConnected () {
    super.onConnected();

    const target = this.target;
    if (!target) return;

    this.id ||= `pop-tip-${Math.random().toString(36).slice(2, 8)}`;
    target.setAttribute('aria-describedby', this.id);

    const later = () => { clearTimeout(this._timer); this._timer = setTimeout(() => this.show(), this.getAttr('delay')); };
    const now   = () => { clearTimeout(this._timer); this.hide(); };

    this.$(target).on('pointerenter focusin', later).on('pointerleave focusout', now);
    this.$(document).onKeyDown(event => { if (event.key === 'Escape') now(); });
    this.track(() => clearTimeout(this._timer));
  }
}

PopTip.init();
