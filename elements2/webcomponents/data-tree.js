import { AufbauElement } from '@aufbau/element';
import { importFile }    from '@aufbau/import';
import { attrs, html }   from '../lib/html.js';

const ITEM = 'data-tree-item';

export default class DataTree extends AufbauElement {
  static internals = { role: 'tree' };

  static attr = {
    src : String,
  };

  static styles = `data-tree { display: block; --skeleton-lines: 6; }`;

  // in-memory data — bypasses `src` and hand-authored markup
  set nodes (value) {
    this._data = Array.isArray(value) ? value : null;
    this.invalidate();
    if (this._mounted) this.update();
  }
  get nodes () { return this._data; }

  get visibleItems () {
    return this.$$(ITEM).filter(item => !item.parentElement.closest(`${ITEM}:not([expanded])`)).nodes;
  }

  onConnected () {
    this.$$(ITEM).onClick((event, item) => {
      if (!event.composedPath().includes(item.$row.node)) return;
      item.toggle();
      item.select();
      item.focus();
    });

    this.onKeyDown(this.navigate);

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

    if (src && src !== this._loadedSrc && this._data == null) {
      this._loadedSrc = src;
      this.setSkeleton(true);
      try {
        this._data = await importFile(src);
      } catch (error) {
        console.warn(`[data-tree] failed to import tree data from "${src}":`, error);
        this._data = null;
      }
      this.setSkeleton(false);
    }

    return super.update();
  }

  // null leaves hand authored items alone
  render () { return this._data == null ? null : this.renderNodes(this._data); }

  renderNodes (nodes) {
    if (!Array.isArray(nodes)) return html``;

    return html`${nodes.map(node => html`
      <data-tree-item ${attrs({
        expanded : Boolean(node.expanded),
        icon     : node.icon,
        label    : node.label ?? node.name ?? '',
        selected : Boolean(node.selected),
        value    : node.value ?? node.id ?? node.path,
      })}>${this.renderNodes(node.children)}</data-tree-item>
    `)}`;
  }

  sync () { this.syncFocus(); }

  syncFocus () {
    const visible = this.visibleItems;
    const stop    = visible.find(item => item.hasAttribute('selected')) ?? visible[0];
    for (const item of this.$$(ITEM)) item.tabIndex = item === stop ? 0 : -1;
  }

  navigate (event) {
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

      case 'ArrowRight':
        if (!item.hasChildren) return;
        event.preventDefault();
        if (!item.getAttr('expanded')) item.expand();
        else item.items[0]?.focus();
        return;

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

DataTree.init();
