// <aufbau-dropdown>
// an action menu. it carries commands, not a value, so it is NOT a control and
// deliberately does not participate in forms. for choosing a value, use
// <aufbau-picker look="combobox">.

import { AufbauElement } from './core/index.js';
import { attrs, html } from '@aufbau/js';
import * as dom from '@domina/core';

export default class AufbauDropdown extends AufbauElement {
  static attr = {
    disabled  : Boolean,
    icon      : String,
    label     : 'menu',
    open      : Boolean,
    placement : { type: String, default: 'bottom-start', values: ['bottom-start', 'bottom-end', 'top-start', 'top-end'] },
  };

  static styles = `
    aufbau-dropdown {
      position: relative;
      display: inline-block;
    }

    aufbau-dropdown .dropdown-trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    aufbau-dropdown .dropdown-trigger:disabled { cursor: not-allowed; opacity: 0.5; }

    aufbau-dropdown .dropdown-caret { transition: rotate 0.15s ease; }
    aufbau-dropdown.is-open .dropdown-caret { rotate: 180deg; }

    aufbau-dropdown .aufbau-dropdown-menu {
      position: absolute;
      z-index: var(--aufbau-overlay-z, 20);
      display: flex;
      flex-direction: column;
      min-inline-size: 100%;
      max-block-size: var(--dropdown-menu-size, 18em);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    aufbau-dropdown[data-placement^="bottom"] .aufbau-dropdown-menu { inset-block-start: 100%; }
    aufbau-dropdown[data-placement^="top"]    .aufbau-dropdown-menu { inset-block-end: 100%; }
    aufbau-dropdown[data-placement$="start"]  .aufbau-dropdown-menu { inset-inline-start: 0; }
    aufbau-dropdown[data-placement$="end"]    .aufbau-dropdown-menu { inset-inline-end: 0; }

    aufbau-dropdown .aufbau-dropdown-menu > * {
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      flex: none;
      color: inherit;
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
    }
  `;

  // the authored menu entries stay in the light dom. the trigger gets its own
  // shell, prepended so it keeps its place ahead of the entries in tab order
  get renderTarget () { return this.shell('aufbau-dropdown-ui', { prepend: true }); }

  /**
   * the entries need one shared box to be positioned as a menu, so they are
   * collected into a container on first sync. they stay the authored elements,
   * they only move one level down.
   */
  get menu () {
    let menu = this.querySelector(':scope > .aufbau-dropdown-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'aufbau-dropdown-menu';
      menu.setAttribute('role', 'menu');
      this.append(menu);
    }
    return menu;
  }

  onMount () {
    this.on('click', '.dropdown-trigger', () => this.toggle());

    this.on('keydown', (event) => {
      if (event.key === 'Escape' && this.getAttr('open')) { event.preventDefault(); this.close(); }
    });

    // any activated entry closes the menu, the entry's own handler still runs
    this.on('click', 'a, button, [role="menuitem"]', () => this.close());

    this.onOutside(() => this.close());
  }

  open   () { return this.setOpen(true);  }
  close  () { return this.setOpen(false); }
  toggle () { return this.setOpen(!this.getAttr('open')); }

  setOpen (open) {
    if (this.getAttr('disabled')) return this;
    this.setAttr({ open });
    this.emit('aufbau-dropdown', { open });
    return this;
  }

  render () {
    const { icon, label } = this.getAttr();

    return html`
      <button type="button" class="dropdown-trigger" aria-haspopup="menu" aria-expanded="false">
        ${icon && html`<aufbau-icon icon="${icon}"></aufbau-icon>`}
        <span class="dropdown-label">${label}</span>
        <aufbau-icon icon="lucide:chevron-down" class="dropdown-caret"></aufbau-icon>
      </button>
    `;
  }

  sync () {
    const { disabled, open, placement } = this.getAttr();

    dom.setAttr(this.$('.dropdown-trigger'), { ariaExpanded: String(open), disabled });
    this.classList.toggle('is-open', open);
    this.dataset.placement = placement;

    // entries are the authored children, everything outside our own shell
    const menu = this.menu;
    for (const child of [...this.children]) {
      if (child === this._shell || child === menu) continue;
      if (!child.getAttribute('role')) child.setAttribute('role', 'menuitem');
      menu.append(child);
    }

    dom.setAttr(menu, { hidden: !open });
  }
}

AufbauDropdown.init();
