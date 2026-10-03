import './svg-icon.js';

import { AufbauElement } from '../base/AufbauElement.js';

export class AppPanel extends AufbauElement {

  static shadow = true;
  static parts  = ['close', 'expand', 'heading'];

  static attr = {
    controls : { type: String, default: 'close expand' },
    heading  : String,
  };

  static styles = `
    :host {
      box-sizing     : border-box;
      display        : flex;
      flex           : 1 1 auto;
      flex-direction : column;
      min-block-size : 0;
    }

    header {
      align-items : center;
      display     : flex;
      flex        : none;
      gap         : 0.5em;
      padding     : var(--panel-header-padding, 0.5rem 0.75rem);

      &[hidden] { display: none; }
    }

    [part="heading"] {
      flex          : 1 1 auto;
      font-weight   : 600;
      min-inline-size : 0;
      overflow        : hidden;
      text-overflow   : ellipsis;
      white-space     : nowrap;
    }

    button {
      align-items   : center;
      background    : none;
      border        : 0;
      border-radius : var(--radius-control, 0.25rem);
      color         : inherit;
      cursor        : pointer;
      display       : inline-flex;
      font          : inherit;
      font-size     : 1.15em;
      padding       : 0.25em;

      &:hover          { background-color: color-mix(in oklab, currentColor 8%, transparent); }
      &:focus-visible  { outline: 2px solid color-mix(in oklab, currentColor 55%, transparent); }
      &[hidden]        { display: none; }
    }

    [part="body"] {
      flex           : 1 1 auto;
      min-block-size : 0;
      overflow       : auto;
      padding        : var(--panel-padding, 0 0.75rem 0.75rem);
    }
  `;

  render () {
    return `
      <header part="header">
        <slot name="start"></slot>
        <strong part="heading"></strong>
        <slot name="actions"></slot>
        <button type="button" part="expand" aria-label="expand"><svg-icon icon="lucide:maximize-2"></svg-icon></button>
        <button type="button" part="close" aria-label="close"><svg-icon icon="lucide:x"></svg-icon></button>
      </header>
      <div part="body"><slot></slot></div>
    `;
  }

  // the area or modal the panel sits in, the nearer one
  get container () { return this.parentElement?.closest(`app-area, app-modal`) ?? null; }

  get area () {
    const container = this.container;
    return container?.localName === 'app-area' ? container : null;
  }

  close () {
    const container = this.container;
    if (container?.localName === 'app-area') container.hide();
    else if (container)                              container.close();
    else this.emit('close');
    return this;
  }

  expand (force) {
    this.area?.expand(force);
    return this;
  }

  onConnected () {
    this.$close.onClick(this.close);
    this.$expand.onClick(() => this.expand());

    // the expand icon follows the area, however it was expanded
    this.$(this.area).on('toggle', () => this.update());
  }

  sync () {
    const { controls, heading } = this.getAttr();
    const wanted   = new Set(String(controls).split(/\s+/));
    const written  = this.hasAttribute('controls');
    const area     = this.area;
    const docked   = Boolean(area?.docked);
    const expanded = Boolean(area?.expanded);
    const modal    = this.container?.localName === 'app-modal';

    this.$heading.text(heading ?? '');
    this.$close.attr({ hidden: !(wanted.has('close') && (written || docked || modal)) });
    this.$expand.attr({ hidden: !(wanted.has('expand') && docked), 'aria-label': expanded ? 'collapse' : 'expand' });
    this.$expand.$('svg-icon').attr({ icon: expanded ? 'lucide:minimize-2' : 'lucide:maximize-2' });
  }
}

AppPanel.init('app-panel');

export default AppPanel;
