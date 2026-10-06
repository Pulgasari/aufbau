// panels/DevPanel.js
// a panel as an element of its own: <dev-console>, <dev-dom>, … inside
// <dev-tools> or anywhere on a page. the panel itself is still its factory,
// { $content, onShow?, onHide? }. shown means connected and not hidden, so a
// panel polls only while it is on screen.

import { AufbauElement } from '@aufbau/element';
import adoptStylesheet   from '@domina/methods/adoptStylesheet.js';
import createElement     from '@domina/methods/createElement.js';

adoptStylesheet(new URL('../devtools.css?v=2', import.meta.url).href, { key: 'devtools' });

export class DevPanel extends AufbauElement {
  static attr = { hidden: Boolean };

  static create = null;          // the factory, none makes a placeholder
  static icon   = 'mdi:help';    // its tab in <dev-tools>

  static styles = `[data-panel] { display: block; } [data-panel][hidden] { display: none; }`;

  get key () { return this.localName.replace(/^dev-/, ''); }

  // built on first use, also before the element is connected
  get panel () {
    return this._panel ??= this.constructor.create?.() ?? { $content: createElement('em', { textContent: 'coming soon ...' }) };
  }

  onConnected () {
    this.dataset.panel = this.key;
    if (!this.id && this.parentElement?.localName === 'dev-tools') this.id = `devtools-${this.key}`;   // the stylesheet speaks of #devtools-<key>
    if (!this._appended) { this.append(...[this.panel.$content].flat()); this._appended = true; }
    this.shown(!this.hidden);
  }

  onDisconnected () { this.shown(false); }

  onAttributeChanged (name) {
    if (name === 'hidden') this.shown(!this.hidden);
  }

  shown (on) {
    if (on === Boolean(this._shown)) return;
    this._shown = on;
    if (on) this.panel.onShow?.();
    else    this.panel.onHide?.();
  }
}

export default DevPanel;
