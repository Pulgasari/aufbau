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
//
// the tree owns interaction for all of its items: clicks on a row, and the
// keyboard pattern of a wai-aria tree view with one roving tab stop.

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import { attrs, html }   from './core/html.js';

const ITEM = 'aufbau-tree-item';

export default class AufbauTree extends AufbauElement {
  static internals = { role: 'tree' };

  static attr = {
    src : String,
  };

  static styles = `aufbau-tree { display: block; }`;


  // in-memory data — bypasses `src` and hand-authored markup
  set nodes (value) {
    this._data = Array.isArray(value) ? value : null;
    this.invalidate();
    if (this._mounted) this.update();
  }
  get nodes () { return this._data; }

  /** every item not hidden inside a collapsed ancestor, in document order */
  get visibleItems () {
    return [...this.querySelectorAll(ITEM)].filter(item => !item.parentElement.closest(`${ITEM}:not([expanded])`));
  }

  onMount () {
    // the row lives in the item's shadow root, the click arrives retargeted to the
    // innermost item. only a click on that item's own row counts
    this.on('click', ITEM, (event, item) => {
      if (!event.composedPath().includes(item.row)) return;
      item.toggle();
      item.select();
      item.focus();
    });

    this.on('keydown', (event) => this.onKeydown(event));

    // items added or removed later (hand authored or by the host app) change the
    // folder state of their parent. one observer for the whole tree, not one per item
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.target.localName === ITEM) record.target.update();
      }
      this.syncFocus();
    });
    observer.observe(this, { childList: true, subtree: true });
    this.track(() => observer.disconnect());
  }

  async update () {
    const { src } = this.getAttr();

    // reload whenever src actually changes (skipped once `nodes` supplied in-memory data)
    if (src && src !== this._loadedSrc && this._data == null) {
      this._loadedSrc = src;
      try {
        this._data = await importFile(src);
      } catch (error) {
        console.warn(`[aufbau-tree] failed to import tree data from "${src}":`, error);
        this._data = null;
      }
    }

    return super.update();
  }

  // null leaves hand authored items alone
  render () { return this._data == null ? null : this.renderNodes(this._data); }

  renderNodes (nodes) {
    if (!Array.isArray(nodes)) return html``;

    return html`${nodes.map(node => html`
      <aufbau-tree-item ${attrs({
        expanded : Boolean(node.expanded),
        icon     : node.icon,
        label    : node.label ?? node.name ?? '',
        selected : Boolean(node.selected),
        value    : node.value ?? node.id ?? node.path,
      })}>${this.renderNodes(node.children)}</aufbau-tree-item>
    `)}`;
  }

  sync () { this.syncFocus(); }

  // roving tabindex: the selected visible item is the one tab stop, the first one otherwise
  syncFocus () {
    const visible = this.visibleItems;
    const stop    = visible.find(item => item.hasAttribute('selected')) ?? visible[0];
    for (const item of this.querySelectorAll(ITEM)) item.tabIndex = item === stop ? 0 : -1;
  }

  onKeydown (event) {
    const item = event.target.closest?.(ITEM);
    if (!item || !this.contains(item)) return;

    const visible = this.visibleItems;
    const index   = visible.indexOf(item);
    const move    = target => { if (target) { event.preventDefault(); target.focus(); } };

    switch (event.key) {
      case 'ArrowDown' : return move(visible[index + 1]);
      case 'ArrowUp'   : return move(visible[index - 1]);
      case 'Home'      : return move(visible[0]);
      case 'End'       : return move(visible.at(-1));

      // right opens a closed folder, on an open one it steps to the first child
      case 'ArrowRight':
        if (!item.hasChildren) return;
        event.preventDefault();
        if (!item.getAttr('expanded')) item.expand();
        else item.items[0]?.focus();
        return;

      // left closes an open folder, otherwise it steps up to the parent
      case 'ArrowLeft':
        event.preventDefault();
        if (item.hasChildren && item.getAttr('expanded')) item.collapse();
        else item.parentElement.closest(ITEM)?.focus();
        return;

      case 'Enter':
      case ' ':
        event.preventDefault();
        item.select();
        if (event.key === 'Enter') item.toggle();
        return;
    }
  }
}

AufbauTree.init();
