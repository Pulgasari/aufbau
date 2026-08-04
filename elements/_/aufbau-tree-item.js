import { AufbauElement } from './AufbauElement.js';

export class AufbauTreeItem extends AufbauElement {
  static get observedAttributes() {
    return ['label', 'icon', 'expanded', 'selected'];
  }

  onMount() {
    this.addEventListener('click', (e) => {
      e.stopPropagation();

      const toggleBtn = e.target.closest('.tree-toggle');
      if (toggleBtn || this.hasChildren()) {
        this.toggleExpand();
      }

      this.select();
    });
  }

  hasChildren() {
    return this.querySelector('aufbau-tree-item') !== null;
  }

  toggleExpand() {
    if (this.hasAttribute('expanded')) {
      this.removeAttribute('expanded');
    } else {
      this.setAttribute('expanded', '');
    }
  }

  select() {
    const rootTree = this.closest('aufbau-tree');
    if (rootTree) {
      rootTree.querySelectorAll('aufbau-tree-item').forEach(item => item.removeAttribute('selected'));
    }
    this.setAttribute('selected', '');
    this.emit('aufbau-tree-select', { label: this.getAttribute('label'), element: this });
  }

  update() {
    const label = this.getAttribute('label') || 'Item';
    const icon = this.getAttribute('icon');
    const isExpanded = this.hasAttribute('expanded');
    const isSelected = this.hasAttribute('selected');
    const hasChildren = this.hasChildren();

    const defaultIcon = hasChildren 
      ? (isExpanded ? 'lucide:folder-open' : 'lucide:folder') 
      : 'lucide:file-text';

    const renderIcon = icon || defaultIcon;

    // Separate node label shell from nested children slot
    let childrenHtml = '';
    const childNodes = Array.from(this.children).filter(el => el.tagName === 'AUFBAU-TREE-ITEM');
    if (childNodes.length > 0) {
      childrenHtml = `<div class="tree-children" ${!isExpanded ? 'hidden' : ''}></div>`;
    }

    this.innerHTML = `
      <div class="tree-node ${isSelected ? 'is-selected' : ''}">
        ${hasChildren ? `
          <button type="button" class="tree-toggle ${isExpanded ? 'is-expanded' : ''}">
            <aufbau-icon icon="lucide:chevron-right"></aufbau-icon>
          </button>
        ` : '<span class="tree-spacer"></span>'}
        <aufbau-icon icon="${renderIcon}" class="tree-icon"></aufbau-icon>
        <span class="tree-label">${label}</span>
      </div>
      ${childrenHtml}
    `;

    // Re-attach child tree items into container slot
    const container = this.querySelector('.tree-children');
    if (container) {
      childNodes.forEach(child => container.appendChild(child));
    }
  }
}

customElements.define('aufbau-tree-item', AufbauTreeItem);
