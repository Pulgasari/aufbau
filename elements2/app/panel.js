// <app-panel>
// a titled frame for content: a header with the heading, room for actions and
// the buttons to close and expand the place it sits in, the content below.
//
//   <app-area name="config" dock="end">
//     <app-panel heading="Settings">
//       <button slot="actions">…</button>
//       …
//     </app-panel>
//   </app-area>
//
// close and expand act on the container: an <app-area> is hidden or expanded,
// an <aufbau-modal> closed. outside of both, close fires a cancelable `close`
// event and leaves the rest to the app. `controls` names the buttons there may
// be, "close expand" by default, and a button only shows where it can act:
// expand in a docked area, close in a container, or anywhere once `controls`
// is written out.
//
// slots: start (before the heading), actions (after it), default
// parts: header, heading, close, expand, body

import '../aufbau/AufbauIcon.js';

import { AufbauElement } from '../core/index.js';


export class AppPanel extends AufbauElement {

  static shadow = true;

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
      overflow      : hidden;
      text-overflow : ellipsis;
      white-space   : nowrap;
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
        <button type="button" part="expand" aria-label="expand"><aufbau-icon icon="lucide:maximize-2"></aufbau-icon></button>
        <button type="button" part="close" aria-label="close"><aufbau-icon icon="lucide:x"></aufbau-icon></button>
      </header>
      <div part="body"><slot></slot></div>
    `;
  }

  /** the area or modal the panel sits in, the nearer one */
  get container () { return this.parentElement?.closest(`app-area, aufbau-modal`) ?? null; }

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

  onMount () {
    this.on(this.shadowRoot, 'click', event => {
      const part = event.target.closest?.('[part]')?.getAttribute('part');
      if (part === 'close')  this.close();
      if (part === 'expand') this.expand();
    });

    // the expand icon follows the area, however it was expanded
    const area = this.area;
    if (area) this.on(area, 'toggle', () => this.update());
  }

  sync () {
    const { controls, heading } = this.getAttr();
    const wanted   = new Set(String(controls).split(/\s+/));
    const written  = this.hasAttribute('controls');
    const area     = this.area;
    const docked   = Boolean(area?.docked);
    const expanded = Boolean(area?.expanded);
    const $        = selector => this.shadowRoot.querySelector(selector);

    $('[part="heading"]').textContent = heading ?? '';
    $('[part="close"]').hidden  = !(wanted.has('close') && (written || docked || this.container?.localName === 'aufbau-modal'));
    $('[part="expand"]').hidden = !(wanted.has('expand') && docked);
    $('[part="expand"]').setAttribute('aria-label', expanded ? 'collapse' : 'expand');
    $('[part="expand"] aufbau-icon').setAttribute('icon', expanded ? 'lucide:minimize-2' : 'lucide:maximize-2');
  }
}

AppPanel.init('app-panel');

export default AppPanel;
