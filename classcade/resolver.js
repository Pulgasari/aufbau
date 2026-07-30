// resolver.js

class Resolver {
  
  resolve (ast) {
    if (!Array.isArray(ast)) ast = [ast];
    return ast.map(node => this.resolveNode(node));
  }

  resolveNode (node) {
    switch (node.type) {
      case 'method'  : return this.resolveMethod  (node);
      case 'rule'    : return this.resolveRule    (node);
      case 'variant' : return this.resolveVariant (node);
    }
  }

  resolveMethod (node) {
    const method = this.registry.getMethod(node.id);
    const args   = node.args.map (
      arg => (typeof arg === 'object') ? this.resolveNode(arg) : arg;
    );
    return method.run(...args);
  }

  resolveRule (node) {
    const rule = this.registry.getRule(node.id);
    const args = node.args.map (
      arg => (typeof arg === 'object') ? this.resolveNode(arg) : arg;
    );
    const declarations = rule.css(...args);

    return {
      id       : node.raw,
      selector : node.selector,
      declarations,
      media    : null,
      supports : null,
      layer    : null,
    };
  }
  
}

export default Resolver;





