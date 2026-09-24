// <aufbau-dropdown>
// an action menu. it carries commands, not a value, so it is NOT a control and
// deliberately does not participate in forms. for choosing a value, use
// <aufbau-picker look="combobox">.
//
//   <aufbau-dropdown label="Datei">
//     <button aria-haspopup="menu">…</button>        <- trigger, created once
//     <div role="menu" popover>…entries…</div>       <- the authored entries, moved in once
//   </aufbau-dropdown>
//
// the menu is an auto popover: top layer, light dismiss and escape come from
// the browser. `open` mirrors the popover state in both directions.

import { AufbauElement } from './core/index.js';
import { place }         from './core/placement.js';
import { setAttr }       from '@domina/methods/setAttr.js';

export default class AufbauDropdown extends AufbauElement {
  static attr = {
    disabled  : Boolean,
    icon      : String,
    label     : 'menu',
    open      : Boolean,
    placement : { type: String, default: 'bottom-start', values: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  };

  static styles = `aufbau-dropdown {
    display: inline-block;

    > button {
      align-items : center;
      color       : inherit;
      cursor      : pointer;
      display     : inline-flex;
      font        : inherit;
      gap         : var(--aufbau-control-gap, 0.5em);
      margin      : 0;

      &:disabled { cursor: not-allowed; opacity: 0.5; }

      > aufbau-icon:last-child { transition: rotate 0.15s ease; }
      &[aria-expanded="true"] > aufbau-icon:last-child { rotate: 180deg; }
    }

    > [role="menu"] {
      border              : 0;
      color               : inherit;
      flex-direction      : column;
      max-block-size      : var(--dropdown-menu-size, 18em);
      overflow-y          : auto;
      overscroll-behavior : contain;
      padding             : 0;

      &:popover-open { display: flex; }

      > * {
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
    }
  }`;

  get trigger () { return this._trigger; }
  get menu    () { return this._menu; }
  get isOpen  () { return Boolean(this._menu?.matches(':popover-open')); }

  onMount () {
    this.build();

    // any activated entry closes the menu, the entry's own handler still runs
    this.on('click', '[role="menu"] :is(a, button, [role="menuitem"])', () => this.close());

    // the popover may close by itself (light dismiss, escape), the attribute follows
    this.on(this._menu, 'toggle', (event) => {
      const open = event.newState === 'open';
      if (open !== this.getAttr('open')) this.setAttr({ open });
      this.emit('aufbau-dropdown', { open });
    });

    this.on(window, 'resize', () => this.reposition(), { passive: true });
    this.on(window, 'scroll', () => this.reposition(), { capture: true, passive: true });
  }

  // trigger and menu are created once. the authored entries move into the menu
  // and stay the very same elements
  build () {
    if (!this._trigger) {
      this._trigger = document.createElement('button');
      this._trigger.type = 'button';
      setAttr(this._trigger, { ariaHaspopup: 'menu', ariaExpanded: 'false' });

      this._menu = document.createElement('div');
      setAttr(this._menu, { popover: 'auto', role: 'menu' });

      // the browser toggles the menu itself and keeps the trigger out of light
      // dismiss, a click handler of ours would close and reopen it in one go
      this._trigger.popoverTargetElement = this._menu;
    }

    const entries = [...this.children].filter(child => child !== this._trigger && child !== this._menu);
    for (const entry of entries) if (!entry.hasAttribute('role')) entry.setAttribute('role', 'menuitem');
    this._menu.append(...entries);

    if (this._trigger.parentNode !== this) this.prepend(this._trigger);
    if (this._menu.parentNode !== this)    this.append(this._menu);
  }

  open   () { return this.setOpen(true);  }
  close  () { return this.setOpen(false); }
  toggle () { return this.setOpen(!this.isOpen); }

  setOpen (open) {
    if (open && this.getAttr('disabled')) return this;
    this.setAttr({ open });
    return this;
  }

  reposition () {
    if (this.isOpen) place(this._menu, this._trigger, { placement: this.getAttr('placement'), maxSize: 18 * 16 });
  }

  render () { return null; }

  sync () {
    if (!this._trigger) return;

    const { disabled, icon, label, open } = this.getAttr();
    const trigger = this._trigger;

    // trigger content: optional icon, label, caret. rebuilt only when icon or label change
    const key = `${icon}|${label}`;
    if (key !== this._triggerKey) {
      this._triggerKey = key;
      const iconOf = name => setAttr(document.createElement('aufbau-icon'), { icon: name });
      const text   = Object.assign(document.createElement('span'), { textContent: label });
      trigger.replaceChildren(...(icon ? [iconOf(icon)] : []), text, iconOf('lucide:chevron-down'));
    }

    trigger.disabled = disabled;
    trigger.setAttribute('aria-expanded', String(open));

    // the attribute drives the popover, the toggle listener closes the loop the other way
    const menu = this._menu;
    if (menu.showPopover && open !== this.isOpen && menu.isConnected) {
      menu[open ? 'showPopover' : 'hidePopover']();
    }
    this.reposition();
  }
}

AufbauDropdown.init();
