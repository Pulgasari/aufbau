// <aufbau-tree>
//
// three ways to feed it, in order of precedence:
//   1. `nodes` property — an in-memory array of { label|name, icon, value|id,
//      expanded, selected, children } (children same shape). set it from JS:
//        treeEl.nodes = [...]        // or, in a vdom lib, <aufbau-tree nodes=${data}/>
//   2. `src` attribute — a url the tree loads its data from (importFile).
//   3. hand-authored <aufbau-tree-item> children — left untouched.
//
// selecting an item bubbles `aufbau-tree-select` and toggling a folder bubbles
// `aufbau-tree-toggle`; both carry the item's `value` so callers can map the
// event back onto their own data.

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import { attrs, html }   from '@aufbau/js';

export default class AufbauTree extends AufbauElement {
  static attr = {
    src : String
  };

  // in-memory data — bypasses `src` and hand-authored markup
  set nodes (value) {
    this._data = Array.isArray(value) ? value : null;
    this.invalidate();
    if (this._mounted) this.update();
  }
  get nodes () { return this._data; }

  async update () {
    const { src } = this.getAttr();

    // reload whenever src actually changes, not just once (skipped once `nodes`
    // has supplied in-memory data)
    if (src && src !== this._loadedSrc && this._data == null) {
      this._loadedSrc = src;
      try {
        this._data = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-tree] failed to import tree data from "${src}":`, err);
        this._data = null;
      }
    }

    // nothing to render from — the markup is authored by hand, leave it alone
    if (this._data == null) return;

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
        value    : node.value ?? node.id ?? node.path,
        expanded : !!node.expanded,
        selected : !!node.selected,
      })}>${this.renderNodes(node.children)}</aufbau-tree-item>
    `)}`;
  }
}

AufbauTree.init();
