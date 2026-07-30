// scanner.js

export class Scanner {

  constructor (options = {}) {
    this.attributes = options.attributes ?? [];    
  }

  scan (root = document) {
    const entries = [];

    // check root + children
    if (root.nodeType === 1) this.scanNode(root, entries);
    const selector = this.attributes.map(attr => `[${attr}]`).join(', ');
    root.querySelectorAll(selector).forEach(node => this.scanNode(node, entries));

    return entries;
  }

  scanNode (node, entries) {
    for (const attribute of this.attributes) {
      if (!node.hasAttribute(attribute)) continue;
      entries.push({ node, attribute, value: node.getAttribute(attribute) });
    }
  }

}

export default Scanner;
