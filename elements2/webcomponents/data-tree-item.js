import { AufbauElement } from '@aufbau/element';
import { html }          from '../lib/html.js';

const ICONS = {
  file   : 'lucide:file-text',
  folder : 'lucide:folder',
  open   : 'lucide:folder-open',
};

export default class DataTreeItem extends AufbauElement {
  static internals = { role: 'treeitem' };

  static shadow = true;
  static parts  = ['icon', 'label', 'row'];

  static attr = {
    expanded : Boolean,
    icon     : String,
    label    : 'Item',
    selected : Boolean,
    value    : String,
  };

  static styles = `
    :host {
      --tree-indent : 1rem;

      display : block;
      outline : none;
    }

    [part~="row"] {
      align-items : center;
      cursor      : pointer;
      display     : flex;
      gap         : 0.25rem;
      padding     : 0.25rem;

      &::before {
        block-size        : 0.4em;
        border-block-end  : 1.5px solid;
        border-inline-end : 1.5px solid;
        content           : '';
        flex              : none;
        inline-size       : 0.4em;
        margin-inline     : 0.3em;
        rotate            : -45deg;
        transition        : rotate 0.12s ease;
        visibility        : hidden;
      }
    }

    :host(:state(branch)) [part~="row"]::before { visibility: visible; }
    :host([expanded]) [part~="row"]::before     { rotate: 45deg; }

    [part~="icon"] { flex: none; }

    [part~="label"] {
      flex            : 1 1 auto;
      min-inline-size : 0;
      overflow        : hidden;
      text-overflow   : ellipsis;
      white-space     : nowrap;
    }

    slot { display: block; padding-inline-start: var(--tree-indent); }
    :host(:not([expanded])) slot { display: none; }
  `;

  get items        () { return [...this.children].filter(child => child.localName === 'data-tree-item'); }
  get hasChildren  () { return this.items.length > 0; }
  get tree         () { return this.closest('data-tree'); }

  // nesting depth, 1 for a top level item
  get level () {
    let level = 1;
    for (let parent = this.parentElement; parent && parent.localName !== 'data-tree'; parent = parent.parentElement) {
      if (parent.localName === 'data-tree-item') level += 1;
    }
    return level;
  }

  // structure only, label and icon are applied in sync()
  render () {
    return html`<div part="row"><svg-icon part="icon"></svg-icon><span part="label"></span></div><slot></slot>`;
  }

  expand   (expanded = true) { return this.setExpanded(expanded); }
  collapse ()                { return this.setExpanded(false); }
  toggle   ()                { return this.setExpanded(!this.getAttr('expanded')); }

  setExpanded (expanded) {
    if (!this.hasChildren || expanded === this.getAttr('expanded')) return this;
    this.setAttr({ expanded });
    this.tree?.syncFocus();   // the tab stop may have just been hidden
    this.emit('data-tree-toggle', { element: this, expanded, label: this.getAttr('label'), value: this.getAttr('value') });
    return this;
  }

  select () {
    this.$(this.tree).$$('data-tree-item[selected]').attr({ selected: false });
    this.setAttr({ selected: true });
    this.tree?.syncFocus();
    this.emit('data-tree-select', { element: this, label: this.getAttr('label'), value: this.getAttr('value') });
    return this;
  }

  sync () {
    if (!this.$row.size) return;

    const { expanded, icon, label, selected } = this.getAttr();
    const hasChildren = this.hasChildren;

    this.$icon.attr({ icon: icon || (hasChildren ? (expanded ? ICONS.open : ICONS.folder) : ICONS.file) });
    this.$label.text(label);
    this.states.toggle('branch', hasChildren);

    if (this.internals) {
      this.internals.ariaExpanded = hasChildren ? String(expanded) : null;
      this.internals.ariaLevel    = String(this.level);
      this.internals.ariaSelected = String(selected);
    }
  }

}

DataTreeItem.init();
