import { AufbauElement } from '@aufbau/element';
import { html }          from '../../lib/html.js';
import { place }         from '../../lib/placement.js';

// the base of pop-over and pop-tip: the element itself is a native popover in the
// top layer, placed at its anchor while it is open
export class Pop extends AufbauElement {
  static popover = 'auto';

  static shadow = true;

  static attr = {
    anchor    : String,   // an id or a selector. without it, what had the focus when it opened
    open      : Boolean,
    placement : { type: String, default: 'bottom-start', values: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  };

  static styles = `:host { box-sizing: border-box; margin: 0; overflow: auto; }`;

  get isOpen () { return this.matches(':popover-open'); }

  get anchorElement () {
    const selector = this.getAttr('anchor');
    if (!selector) return this._invoker ?? null;
    return document.getElementById(selector) ?? this.getRootNode().querySelector?.(selector) ?? document.querySelector(selector);
  }

  show   () { return this.setAttr({ open: true }); }
  hide   () { return this.setAttr({ open: false }); }
  toggle () { return this.setAttr({ open: !this.isOpen }); }

  onConnected () {
    if (!this.hasAttribute('popover')) this.setAttribute('popover', this.constructor.popover);

    // the focus moves into the popover once it is open, so the invoker is taken before
    this.on('beforetoggle', event => { if (event.newState === 'open') this._invoker = deepFocus(); });

    this.on('toggle', event => {
      const open = event.newState === 'open';
      this.states.toggle('open', open);
      if (open !== this.getAttr('open')) this.setAttr({ open });
      this.position();
      this.emit(this.localName, { open });
    });

    this.$(window).on('resize', () => this.position(), { passive: true });
    this.$(window).on('scroll', () => this.position(), { capture: true, passive: true });
  }

  position () {
    const anchor = this.anchorElement;
    if (this.isOpen && anchor) place(this, anchor, { matchWidth: false, maxSize: window.innerHeight / 2, placement: this.getAttr('placement') });
  }

  render () { return html`<slot></slot>`; }

  sync () {
    const open = this.getAttr('open');
    if (this.isConnected && this.hasAttribute('popover') && open !== this.isOpen) open ? this.showPopover() : this.hidePopover();
  }
}

// the focused element, also inside shadow roots
function deepFocus () {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active === document.body ? null : active;
}
