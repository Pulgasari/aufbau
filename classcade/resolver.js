// resolver.js

import { arrayfied, isString } from './utils';

function escapeSelector (raw) {
  // eckige/runde Klammern, Doppelpunkte, Kommas etc. müssen für CSS-Selektoren escaped werden
  return raw.replace(/[\[\]():,.!#%]/g, ch => `\\${ch}`);
}

class Resolver {

  constructor (registry) {
    this.registry = registry;
  }
  
  resolve (ast) {
    return arrayfied(ast).map(node => this.resolveNode(node));
  }

  resolveNode (node) {
    const def  = this.registry.get(node.id);
    const args = node.args.map (arg => isString(arg) ? arg : this.resolveNode(arg));    
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





