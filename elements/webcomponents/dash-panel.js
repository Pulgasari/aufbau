import './svg-icon.js';

import { AufbauElement } from '@aufbau/element';

// a panel of a dash-board: a header with the heading and slotted actions, the
// content below. `span` and `rows` take more than one cell of the board,
// `collapsible` adds a button that folds the content away. a sortable board lifts
// a panel by its header
export class DashPanel extends AufbauElement {

  static shadow  = true;
  static parts   = ['collapse', 'heading'];
  static reflect = ['collapsed'];

  static attr = {
    collapsed   : Boolean,
    collapsible : Boolean,
    heading     : String,
    name        : String,
    rows        : { type: String, var: '--dash-rows' },
    span        : { type: String, var: '--dash-span' },
  };

  static styles = `
    :host {
      background-color : var(--dash-panel-background, color-mix(in oklab, currentColor 4%, transparent));
      border           : 1px solid color-mix(in oklab, currentColor 12%, transparent);
      border-radius    : var(--dash-panel-radius, --radius());
      box-sizing       : border-box;
      display          : flex;
      flex-direction   : column;
      grid-column      : span min(var(--dash-span, 1), var(--dash-columns, 1));
      grid-row         : span var(--dash-rows, 1);
      min-inline-size  : 0;
    }

    [part="header"] {
      align-items : center;
      display     : flex;
      flex        : none;
      gap         : --space(small);
      padding     : var(--dash-panel-header-padding, --space(small) --space(normal));
    }

    [part="heading"] {
      flex            : 1 1 auto;
      font-weight     : 600;
      min-inline-size : 0;
      overflow        : hidden;
      text-overflow   : ellipsis;
      white-space     : nowrap;
    }

    button {
      align-items   : center;
      background    : none;
      border        : 0;
      border-radius : --radius();
      color         : inherit;
      cursor        : pointer;
      display       : inline-flex;
      font          : inherit;
      font-size     : 1.15em;
      padding       : --space(tiny);

      &:hover         { background-color: color-mix(in oklab, currentColor 8%, transparent); }
      &:focus-visible { outline: 2px solid color-mix(in oklab, currentColor 55%, transparent); }
      &[hidden]       { display: none; }
    }

    [part="body"] {
      flex           : 1 1 auto;
      min-block-size : 0;
      overflow       : auto;
      padding        : var(--dash-panel-padding, 0 --space(normal) --space(normal));
    }

    :host([collapsed])                { align-self: start; }
    :host([collapsed]) [part="body"]  { display: none; }
  `;

  render () {
    return `
      <header part="header">
        <slot name="start"></slot>
        <strong part="heading"></strong>
        <slot name="actions"></slot>
        <button type="button" part="collapse"><svg-icon icon="chevron-up"></svg-icon></button>
      </header>
      <div part="body"><slot></slot></div>
    `;
  }

  get collapsed ()      { return this.hasAttribute('collapsed'); }
  set collapsed (value) { this.toggleAttribute('collapsed', Boolean(value)); }

  // folds the content away, `force` sets the state instead of turning it over
  collapse (force = !this.collapsed) {
    if (force === this.collapsed) return this;
    this.collapsed = force;
    this.emit('toggle', { collapsed: force });
    return this;
  }

  onConnected () {
    this.$collapse.onClick(() => this.collapse());
  }

  sync () {
    const { collapsed, collapsible, heading } = this.getAttr();

    this.$heading.text(heading ?? '');
    this.$collapse.attr({ 'aria-expanded': String(!collapsed), 'aria-label': collapsed ? 'expand' : 'collapse', hidden: !collapsible });
    this.$collapse.$('svg-icon').attr({ icon: collapsed ? 'chevron-down' : 'chevron-up' });
  }
}

DashPanel.init('dash-panel');

export default DashPanel;
