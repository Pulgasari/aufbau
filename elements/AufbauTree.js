// <aufbau-tree>

import AufbauElement from './AufbauElement.js';
import importFile     from '@aufbau/import';

export class AufbauTree extends AufbauElement {
  static get observedAttributes () { return ['src']; }

  async update () {
    const src = this.getAttr('src');
    if (!src || this._renderedFromSrc) return;

    try {
      const data = await importFile(src);
      this.innerHTML = this.renderNodes(data);
      this._renderedFromSrc = true;
    } catch (err) {
      console.warn(`[aufbau-tree] Failed to import tree data from "${src}":`, err);
    }
  }

  renderNodes (nodes) {
    if (!Array.isArray(nodes)) return '';

    return nodes.map(node => `
      <aufbau-tree-item
        label="${node.label || node.name}"
        ${node.icon ? `icon="${node.icon}"` : ''}
        ${node.expanded ? 'expanded' : ''}
      >
        ${node.children ? this.renderNodes(node.children) : ''}
      </aufbau-tree-item>
    `).join('');
  }
}

if (!customElements.get('aufbau-tree')) customElements.define('aufbau-tree', AufbauTree);
export default AufbauTree;
