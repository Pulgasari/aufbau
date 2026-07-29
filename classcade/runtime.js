// runtime.js

export class Observer {

  constructor (runtime) {
    this.runtime  = runtime;
    this.observer = null;
  }

  start () {
    if (this.observer) return;

    this.observer = new MutationObserver (mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach (node => (node.nodeType === 1) && this.runtime.process(node));
        if (mutation.type === 'attributes') this.runtime.process(mutation.target);
      }
    });

    this.observer.observe (document.documentElement, { attributes: true, childList: true, subtree: true });     
  }

  stop () {
    this.observer?.disconnect();
    this.observer = null;
  }

}

export class Scanner {

  constructor (options = {}) {
    this.attributes = options.attributes ?? ['cc', 'class', 'classcade', 'className', 'data-classcade'];    
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

export class Runtime {

  constructor (classcade) {
    this.classcade = classcade;
    this.observer  = new Observer (this);
    this.scanner   = new Scanner({ attributes: classcade.options.attributes });   
  }

  start () {
    this.process(document);
    this.observer.start();
  }

  stop () {
    this.observer.stop();
  }

  process (root) {
    const entries = this.scanner.scan(root);
    
    for (const entry of entries) {
      const ast   = this.classcade.options.parser.parse(entry.value);
      const rules = this.classcade.resolver.resolve(ast);

      for (const rule of rules) {
        if (this.classcade.injector.has(rule.id)) continue;

        const css = this.classcade.generator.generate(rule);
        this.classcade.injector.inject(rule.id, css);
      }
    }
  }

}

export default Runtime;
