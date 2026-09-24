// <aufbau-dropdown>
// an action menu. it carries commands, not a value, so it is NOT a control and
// deliberately does not participate in forms. for choosing a value, use
// <aufbau-picker look="combobox">.
//
// trigger and menu live in the shadow root, the children are the entries and
// are projected into the menu. nothing is moved.
//
//   <aufbau-dropdown label="Datei">        shadow: <button part="trigger">
//     <button>Öffnen</button>                        <div part="menu" role="menu" popover>
//     <a href="…">Export</a>                           <slot>
//   </aufbau-dropdown>
//
// the menu is an auto popover: top layer, light dismiss and escape come from
// the browser. `open` mirrors the popover state in both directions.
// parts: trigger, icon, label, caret, menu

import { AufbauElement } from './core/index.js';
import { html }          from './core/html.js';
import { place }         from './core/placement.js';

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

    /* the entries are the author's elements, ::slotted only reaches them, not their insides */
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

  get trigger () { return this.$('[part~="trigger"]'); }
  get menu    () { return this.$('[part~="menu"]'); }
  get isOpen  () { return Boolean(this.menu?.matches(':popover-open')); }

  onMount () {
    // any activated entry closes the menu, the entry's own handler still runs
    this.on('click', ENTRY, (event, entry) => { if (this.contains(entry)) this.close(); });

    // the popover may close by itself (light dismiss, escape), the attribute follows.
    // toggle does not bubble, capturing on the root sees it for every menu a rebuild creates
    this.on(this.root, 'toggle', (event) => {
      if (event.target !== this.menu) return;
      const open = event.newState === 'open';
      if (open !== this.getAttr('open')) this.setAttr({ open });
      this.emit('aufbau-dropdown', { open });
    }, { capture: true });

    this.on(window, 'resize', () => this.reposition(), { passive: true });
    this.on(window, 'scroll', () => this.reposition(), { capture: true, passive: true });
  }

  // the browser toggles the menu itself and keeps the trigger out of light dismiss
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
        ${icon && html`<aufbau-icon part="icon" icon="${icon}"></aufbau-icon>`}
        <span part="label">${label}</span>
        <aufbau-icon part="caret" icon="lucide:chevron-down"></aufbau-icon>
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

    // entries without a role are menu items. an attribute only, the element stays where the author put it
    for (const entry of this.children) if (!entry.hasAttribute('role')) entry.setAttribute('role', 'menuitem');

    // the attribute drives the popover, the toggle listener closes the loop the other way
    const menu = this.menu;
    if (menu.showPopover && open !== this.isOpen) menu[open ? 'showPopover' : 'hidePopover']();
    this.reposition();
  }
}

AufbauDropdown.init();
