// <aufbau-tree>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import { attrs, html }   from '@aufbau/js';

export default class AufbauTree extends AufbauElement {
  static attr = {
    src : String
  };

  async update () {
    const { src } = this.getAttr();

    // reload whenever src actually changes, not just once
    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        this._data = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-tree] failed to import tree data from "${src}":`, err);
        this._data = null;
      }
    }

    // no src at all means the markup is authored by hand, leave the children alone
    if (!this._loadedSrc) return;

    super.update();
  }

  render () {
    return this.renderNodes(this._data);
  }

  renderNodes (nodes) {
    if (!Array.isArray(nodes)) return html``;

    return html`${nodes.map(node => html`
      <aufbau-tree-item ${attrs({
        label    : node.label ?? node.name ?? '',
        icon     : node.icon,
        expanded : !!node.expanded,
      })}>${this.renderNodes(node.children)}</aufbau-tree-item>
    `)}`;
  }
}

AufbauTree.init();
