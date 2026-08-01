// <aufbau-tree-item>

import AufbauElement from './AufbauElement.js';

export class AufbauTreeItem extends AufbauElement {
  static get observedAttributes () {
    return ['label', 'icon', 'expanded', 'selected'];
  }

  onMount () {
    this.on('click', (e) => {
      e.stopPropagation();

      if (e.target.closest('.tree-toggle') || this.hasChildren()) this.toggleExpand();
      this.select();
    });
  }

  hasChildren () {
    return this.querySelector('aufbau-tree-item') !== null;
  }

  toggleExpand () {
    this.setAttributes({ expanded: !this.hasAttribute('expanded') });
  }

  select () {
    this.closest('aufbau-tree')
      ?.querySelectorAll('aufbau-tree-item')
      .forEach(item => item.removeAttribute('selected'));

    this.setAttributes({ selected: true });
    this.emit('aufbau-tree-select', { label: this.attr('label'), element: this });
  }

  update () {
    const label = this.attr('label', String, 'Item');
    const icon  = this.attr('icon');
    const { expanded: isExpanded, selected: isSelected } = this.getAttributes(Boolean);
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

    // re-attach nested items into the freshly rendered container
    const container = this.$('.tree-children');
    childNodes.forEach(child => container?.appendChild(child));
  }
}

if (!customElements.get('aufbau-tree-item')) customElements.define('aufbau-tree-item', AufbauTreeItem);
export default AufbauTreeItem;
