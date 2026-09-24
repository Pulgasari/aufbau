// <aufbau-tree-item>
// one node of an <aufbau-tree>. its child items stay direct children, nothing
// is moved around. the only rendered part is the row in front of them:
//
//   <aufbau-tree-item label="src" expanded>
//     <div><aufbau-icon></aufbau-icon><span>src</span></div>   <- the row
//     <aufbau-tree-item label="index.js"></aufbau-tree-item>
//   </aufbau-tree-item>
//
// the chevron is the row's ::before, drawn in css. interaction and keyboard
// handling live in <aufbau-tree>, the item only knows its own state.

import { AufbauElement } from './core/index.js';

const ICONS = {
  file   : 'lucide:file-text',
  folder : 'lucide:folder',
  open   : 'lucide:folder-open',
};

export default class AufbauTreeItem extends AufbauElement {
  static attr = {
    expanded : Boolean,
    icon     : String,
    label    : 'Item',
    selected : Boolean,
    value    : String,
  };

  static styles = `aufbau-tree-item {
    --tree-indent : 1rem;

    display : block;
    outline : none;

    > div {
      align-items : center;
      cursor      : pointer;
      display     : flex;
      gap         : 0.25rem;
      padding     : 0.25rem;

      /* chevron, only visible for items with children. hidden it still keeps the column */
      &::before {
        block-size         : 0.4em;
        border-block-end   : 1.5px solid;
        border-inline-end  : 1.5px solid;
        content            : '';
        flex               : none;
        inline-size        : 0.4em;
        margin-inline      : 0.3em;
        rotate             : -45deg;
        transition         : rotate 0.12s ease;
        visibility         : hidden;
      }

      > aufbau-icon { flex: none; }

      > span {
        flex            : 1 1 auto;
        min-inline-size : 0;
        overflow        : hidden;
        text-overflow   : ellipsis;
        white-space     : nowrap;
      }
    }

    &:has(> aufbau-tree-item) > div::before { visibility: visible; }
    &[expanded] > div::before               { rotate: 45deg; }

    > aufbau-tree-item                      { padding-inline-start: var(--tree-indent); }
    &:not([expanded]) > aufbau-tree-item    { display: none; }
  }`;

  constructor () {
    super();
    this._internals = this.attachInternals?.() ?? null;
    if (this._internals) this._internals.role = 'treeitem';
  }

  get row          () { return this._row; }
  get items        () { return [...this.children].filter(child => child.localName === 'aufbau-tree-item'); }
  get hasChildren  () { return this.items.length > 0; }
  get tree         () { return this.closest('aufbau-tree'); }

  // nesting depth, 1 for a top level item
  get level () {
    let level = 1;
    for (let parent = this.parentElement; parent && parent.localName !== 'aufbau-tree'; parent = parent.parentElement) {
      if (parent.localName === 'aufbau-tree-item') level += 1;
    }
    return level;
  }

  // the row is created once and kept, a re-render would drop the child items
  onMount () {
    if (!this._row) {
      this._row = document.createElement('div');
      this._row.append(document.createElement('aufbau-icon'), document.createElement('span'));
    }
    if (this._row.parentNode !== this) this.prepend(this._row);
  }

  render () { return null; }

  expand   (expanded = true) { return this.setExpanded(expanded); }
  collapse ()                { return this.setExpanded(false); }
  toggle   ()                { return this.setExpanded(!this.getAttr('expanded')); }

  setExpanded (expanded) {
    if (!this.hasChildren || expanded === this.getAttr('expanded')) return this;
    this.setAttr({ expanded });
    this.tree?.syncFocus();   // the tab stop may have just been hidden
    this.emit('aufbau-tree-toggle', { element: this, expanded, label: this.getAttr('label'), value: this.getAttr('value') });
    return this;
  }

  select () {
    for (const item of this.tree?.querySelectorAll('aufbau-tree-item[selected]') ?? []) {
      if (item !== this) item.removeAttribute('selected');
    }
    this.setAttr({ selected: true });
    this.tree?.syncFocus();
    this.emit('aufbau-tree-select', { element: this, label: this.getAttr('label'), value: this.getAttr('value') });
    return this;
  }

  sync () {
    if (!this._row) return;

    const { expanded, icon, label, selected } = this.getAttr();
    const hasChildren = this.hasChildren;
    const [iconElement, text] = this._row.children;

    iconElement.setAttribute('icon', icon || (hasChildren ? (expanded ? ICONS.open : ICONS.folder) : ICONS.file));
    if (text.textContent !== label) text.textContent = label;

    if (this._internals) {
      this._internals.ariaExpanded = hasChildren ? String(expanded) : null;
      this._internals.ariaLevel    = String(this.level);
      this._internals.ariaSelected = String(selected);
    }
  }
}

AufbauTreeItem.init();
