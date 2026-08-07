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

  // the authored menu entries stay in the light dom. the trigger gets its own
  // shell, prepended so it keeps its place ahead of the entries in tab order
  get renderTarget () { return this.shell('aufbau-dropdown-ui', { prepend: true }); }

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
    for (const child of this.children) {
      if (child === this._shell) continue;
      dom.setAttr(child, { hidden: !open });
      if (!child.getAttribute('role')) child.setAttribute('role', 'menuitem');
    }
  }
}

AufbauDropdown.init();
