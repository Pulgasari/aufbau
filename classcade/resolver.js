// resolver.js

import { arrayfied, isStr } from './utils';

class Resolver {
  
  resolve (ast) {
    return arrayfied(ast).map(node => this.resolveNode(node));
  }

  resolveNode (node) {
    const def  = this.registry.get(node.id);
    const args = node.args.map (arg => isStr(arg) ? arg : this.resolveNode(arg));    
    let done = def.css(...args);
    
    if (node.type === 'method') {}
    if (node.type === 'rule') return {
      declarations: done,
      id       : node.raw,
      selector : node.selector,
      layer    : null,
      media    : null,
      supports : null,
    };

    return done;
  }
  
}

export default Resolver;





