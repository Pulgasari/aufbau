// <aufbau-tree>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';

export default class AufbauTree extends AufbauElement {
  static attr = {
    src : String
  };

  async update () {
    const { src } = this.getAttr();
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

AufbauTree.init();
