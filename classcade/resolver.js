// resolver.js

import { arrayfied, isString } from './utils.js';

function escapeSelector (raw) {
  // eckige/runde Klammern, Doppelpunkte, Kommas etc. müssen für CSS-Selektoren escaped werden
  return raw.replace(/[\[\]()\/:,.!#%]/g, ch => `\\${ch}`);
}

class Resolver {

  constructor (registry) {
    this.registry = registry;
  }
  
  resolve (ast) {
    return arrayfied(ast).map(node => this.resolveNode(node));
  }

  resolveNode (node) {
    if (node.type === 'variant') {
      const inner  = this.resolveNode(node.node);
      const prefix = node.variants.map(v => (this.registry.get(v)?.selector) ?? `.${v}`).join('');
      return { ...inner, selector: `${prefix}${inner.selector}` };
    }
  
    const def  = this.registry.get(node.id);
    if (!def) throw new Error(`[classcade] Unknown utility "${node.id}"`);
  
    const args = node.args.map(arg => isString(arg) ? arg : this.resolveNode(arg));
    const done = def.css(...args);
  
    if (node.type === 'method') return done; // gibt Werte zurück, kein eigenständiges Rule-Objekt
  
    return {
      id           : node.raw,
      selector     : `.${escapeSelector(node.raw)}${node.important ? '' : ''}`,
      declarations : node.important
        ? Object.fromEntries(Object.entries(done).map(([k, v]) => [k, `${v} !important`]))
        : done,
      layer    : null,
      media    : null,
      supports : null,
    };
  }
  
}

export default Resolver;





