// resolver.js
import { arrayfied } from './utils.js';

function escapeSelector (raw) {
  return raw.replace(/[\[\]():,.!#%\/\s+*]/g, ch => `\\${ch}`);
}

class Resolver {
  constructor (registry) {
    this.registry = registry;
  }

  resolve (ast) {
    return arrayfied(ast).map(node => this.resolveNode(node));
  }

  resolveNode (node) {
    if (node.type === 'variant') return this.resolveVariant(node);
    if (node.type === 'decl')    return this.resolveDecl(node);
    throw new Error(`[classcade] Unknown node type "${node.type}"`);
  }

  resolveDecl (node) {
    let declarations;

    if (node.value === null) {
      // kein [value] -> muss ein registrierter shorthand sein (Schritt 3)
      const def = this.registry.get(node.prop);
      if (!def || def.type !== 'shorthand') {
        throw new Error(`[classcade] "${node.prop}" hat keinen Wert und ist kein registrierter Shorthand.`);
      }
      declarations = { ...def.declarations };
    } else {
      declarations = { [node.prop]: node.value }; // Schritt 1: reines Passthrough
    }

    if (node.important) {
      declarations = Object.fromEntries(
        Object.entries(declarations).map(([k, v]) => [k, `${v} !important`])
      );
    }

    return {
      id       : node.raw,
      selector : `.${escapeSelector(node.raw)}`,
      declarations,
      layer: null, media: null, supports: null,
    };
  }

  resolveVariant (node) {
    const inner = this.resolveNode(node.node);
    let prefix = '', suffix = '', media = inner.media ?? null;

    for (const v of node.variants) {
      suffix += `:${v}`; // Schritt 1: unbekannte Variant -> naiv als Pseudo-Klasse
    }

    return { ...inner, selector: `${prefix}${inner.selector}${suffix}`, media };
  }
}

export default Resolver;
