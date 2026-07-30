// @classcade/compiler/resolver.js

import { arrayfied } from './../utils.js';

function escapeSelector (raw) {
  return raw.replace(/[\[\]():,.!#%\/\s+*:]/g, ch => `\\${ch}`);
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
      const def = this.registry.get(node.prop);
      if (!def || def.kind !== 'shorthand') {
        throw new Error(`[classcade] "${node.prop}" hat keinen Wert und ist kein registrierter Shorthand.`);
      }
      declarations = { ...def.declarations };
    } else {
      const alias   = this.registry.get(node.prop);
      const cssProp = (alias?.kind === 'alias-prop') ? alias.ref : node.prop;
      declarations  = { [cssProp]: this.resolveValue(node.value) };
    }

    if (node.important) {
      declarations = Object.fromEntries(Object.entries(declarations).map(([k, v]) => [k, `${v} !important`]));
    }

    return { id: node.raw, selector: `.${escapeSelector(node.raw)}`, declarations, layer: null, media: null, supports: null };
  }

  // ersetzt registrierte Funktions-Aliase innerhalb eines rohen Werts,
  // z.B. "ld(white black)" -> "light-dark(white black)"
  resolveValue (raw) {
    return raw.replace(/([a-zA-Z_-][a-zA-Z0-9_-]*)\(/g, (match, name) => {
      const def = this.registry.get(name);
      return (def?.kind === 'alias-fn') ? `${def.ref}(` : match;
    });
  }

  resolveVariant (node) {
    const inner = this.resolveNode(node.node);
    let prefix = '', suffix = '', media = inner.media ?? null;

    for (const v of node.variants) {
      const def = this.registry.get(v);
      if (def?.kind === 'variant-media')  { media = def.query; continue; }
      if (def?.kind === 'variant-prefix') { prefix = def.selector + prefix; continue; }
      suffix += def?.kind === 'variant-suffix' ? def.selector : `:${v}`; // Fallback: unbekannt -> naive Pseudoklasse
    }

    return { ...inner, selector: `${prefix}${inner.selector}${suffix}`, media };
  }
}

export default Resolver;





// spec-resolver.js

// Erkennt "prop: value; prop2: value2" (rohes CSS) vs. classcade-Syntax
// ("bg[transparent]", "block"). Heuristik: enthält der String kein "[" und
// matched das Muster "ident:", ist es CSS. Sonst wird's als classcade-String
// an den mitgegebenen Resolver zurückgereicht.
function looksLikeCss (str) {
  return !str.includes('[') && /^[a-zA-Z-]+\s*:/.test(str);
}

function fromCssString (str) {
  return str.split(';').map(s => s.trim()).filter(Boolean).reduce((acc, decl) => {
    const i = decl.indexOf(':');
    if (i === -1) return acc;
    acc[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    return acc;
  }, {});
}

// resolveClasscadeString: (source: string) => { [prop]: value }
// wird vom Compiler injiziert (nutzt dessen eigenen Parser+Resolver)
export function normalizeSpec (spec, resolveClasscadeString) {
  if (spec == null) return {};

  if (Array.isArray(spec)) {
    return spec.reduce((acc, s) => Object.assign(acc, normalizeSpec(s, resolveClasscadeString)), {});
  }

  if (typeof spec === 'object') {
    if ('prop' in spec && 'value' in spec) return { [spec.prop]: spec.value };
    return { ...spec }; // schon ein flaches { prop: value }
  }

  if (typeof spec === 'string') {
    const trimmed = spec.trim();
    return looksLikeCss(trimmed) ? fromCssString(trimmed) : resolveClasscadeString(trimmed);
  }

  throw new Error(`[classcade] Cannot normalize spec: ${JSON.stringify(spec)}`);
}
