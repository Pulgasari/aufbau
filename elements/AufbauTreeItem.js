// <aufbau-tree-item>

import { AufbauElement } from './core/index.js';

export default class AufbauTreeItem extends AufbauElement {
  static attr = {
    expanded : Boolean,
    icon     : String,
    label    : 'Item',
    selected : Boolean
  };

  onMount () {
    this.on('click', (e) => {
      e.stopPropagation();

      if (e.target.closest('.tree-toggle') || this.hasChildren()) this.toggleExpand();
      this.select();
    });
  }

  hasChildren () {
    return this.$('aufbau-tree-item') !== null;
  }

  toggleExpand () {
    const { expanded } = this.getAttr();
    this.setAttr({ expanded: !expanded });
  }

  select () {
    this.closest('aufbau-tree')
      ?.querySelectorAll('aufbau-tree-item')
      .forEach(item => item.removeAttribute('selected'));

    this.setAttr({ selected: true });
    this.emit('aufbau-tree-select', { label: this.getAttr('label'), element: this });
  }

  update () {
    const { expanded: isExpanded, icon, label, selected: isSelected } = this.getAttr();
    const hasChildren = this.hasChildren();

    const defaultIcon = hasChildren
      ? (isExpanded ? 'lucide:folder-open' : 'lucide:folder')
      : 'lucide:file-text';

    const childNodes = Array.from(this.children).filter(el => el.tagName === 'AUFBAU-TREE-ITEM');
    const childrenHtml = childNodes.length
      ? `<div class="tree-children" ${!isExpanded ? 'hidden' : ''}></div>`
      : '';

    this.innerHTML = `
      <div class="tree-node ${isSelected ? 'is-selected' : ''}">
        ${hasChildren
          ? `<button type="button" class="tree-toggle ${isExpanded ? 'is-expanded' : ''}">
               <aufbau-icon icon="lucide:chevron-right"></aufbau-icon>
             </button>`
          : '<span class="tree-spacer"></span>'}
        <aufbau-icon icon="${icon || defaultIcon}" class="tree-icon"></aufbau-icon>
        <span class="tree-label">${label}</span>
      </div>
      ${childrenHtml}
    `;

    const container = this.$('.tree-children');
    childNodes.forEach(child => container?.appendChild(child));
  }
}

AufbauTreeItem.init();
