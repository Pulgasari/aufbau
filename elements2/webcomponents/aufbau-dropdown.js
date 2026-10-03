import { AufbauElement } from '../base/AufbauElement.js';
import { html }          from '../lib/html.js';
import { place }         from '../lib/placement.js';

const ENTRY = 'a, button, [role="menuitem"]';

export default class AufbauDropdown extends AufbauElement {
  static shadow = true;

  static attr = {
    disabled  : Boolean,
    icon      : String,
    label     : 'menu',
    open      : Boolean,
    placement : { type: String, default: 'bottom-start', values: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  };

  static styles = `
    :host { display: inline-block; }

    [part~="trigger"] {
      align-items : center;
      color       : inherit;
      cursor      : pointer;
      display     : inline-flex;
      font        : inherit;
      gap         : var(--aufbau-control-gap, 0.5em);
      margin      : 0;

      &:disabled { cursor: not-allowed; opacity: 0.5; }

      &[aria-expanded="true"] > [part~="caret"] { rotate: 180deg; }
    }

    [part~="caret"] { transition: rotate 0.15s ease; }

    [part~="menu"] {
      border              : 0;
      color               : inherit;
      flex-direction      : column;
      max-block-size      : var(--dropdown-menu-size, 18em);
      overflow-y          : auto;
      overscroll-behavior : contain;
      padding             : 0;

      &:popover-open { display: flex; }
    }

    ::slotted(*) {
      align-items     : center;
      color           : inherit;
      cursor          : pointer;
      display         : flex;
      flex            : none;
      font            : inherit;
      gap             : var(--aufbau-control-gap, 0.5em);
      text-align      : start;
      text-decoration : none;
    }
  `;

  get trigger () { return this.part('trigger').node; }
  get menu    () { return this.part('menu').node; }
  get isOpen  () { return Boolean(this.menu?.matches(':popover-open')); }

  onConnected () {
    this.on('click', ENTRY, (event, entry) => { if (this.contains(entry)) this.close(); });

    this.part('menu').on('toggle', event => {
      const open = event.newState === 'open';
      if (open !== this.getAttr('open')) this.setAttr({ open });
      this.emit('aufbau-dropdown', { open });
    });

    this.$(window).on('resize', () => this.reposition(), { passive: true });
    this.$(window).on('scroll', () => this.reposition(), { capture: true, passive: true });
  }

  onRender () { this.trigger.popoverTargetElement = this.menu; }

  open   () { return this.setOpen(true);  }
  close  () { return this.setOpen(false); }
  toggle () { return this.setOpen(!this.isOpen); }

  setOpen (open) {
    if (open && this.getAttr('disabled')) return this;
    this.setAttr({ open });
    return this;
  }

  reposition () {
    if (this.isOpen) place(this.menu, this.trigger, { placement: this.getAttr('placement'), maxSize: 18 * 16 });
  }

  render () {
    const { icon, label } = this.getAttr();

    return html`
      <button type="button" part="trigger" aria-haspopup="menu" aria-expanded="false">
        ${icon && html`<svg-icon part="icon" icon="${icon}"></svg-icon>`}
        <span part="label">${label}</span>
        <svg-icon part="caret" icon="lucide:chevron-down"></svg-icon>
      </button>
      <div part="menu" role="menu" popover="auto"><slot></slot></div>
    `;
  }

  sync () {
    const trigger = this.trigger;
    if (!trigger) return;

    const { disabled, open } = this.getAttr();

    trigger.disabled = disabled;
    trigger.setAttribute('aria-expanded', String(open));

    for (const entry of this.children) if (!entry.hasAttribute('role')) entry.setAttribute('role', 'menuitem');

    const menu = this.menu;
    if (menu.showPopover && open !== this.isOpen) menu[open ? 'showPopover' : 'hidePopover']();
    this.reposition();
  }
}

AufbauDropdown.init();
