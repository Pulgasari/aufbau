import { AufbauElement } from './AufbauElement.js';
import aufbau from '@aufbau/kit';

export class AufbauTree extends AufbauElement {
  static get observedAttributes() {
    return ['src'];
  }

  async update() {
    const src = this.getAttribute('src');

    if (src && !this._renderedFromSrc) {
      try {
        const data = await aufbau.import(src);
        this.innerHTML = this.renderNodesFromData(data);
        this._renderedFromSrc = true;
      } catch (err) {
        console.warn(`[aufbau-tree] Failed to import tree data from "${src}":`, err);
      }
    }
  }

  renderNodesFromData(nodes) {
    if (!Array.isArray(nodes)) return '';

    return nodes.map(node => `
      <aufbau-tree-item 
        label="${node.label || node.name}" 
        ${node.icon ? `icon="${node.icon}"` : ''} 
        ${node.expanded ? 'expanded' : ''}
      >
        ${node.children ? this.renderNodesFromData(node.children) : ''}
      </aufbau-tree-item>
    `).join('');
  }
}

customElements.define('aufbau-tree', AufbauTree);
