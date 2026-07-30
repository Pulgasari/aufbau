// compiler.js — Ergänzungen
import { normalizeSpec } from './spec-resolver.js';

class Compiler {
  ...
  definePropAlias (id, ref) { this.add({ id, kind: 'alias-prop', ref }); return this; }
  defineFnAlias   (id, ref) { this.add({ id, kind: 'alias-fn',   ref }); return this; }

  defineVariant (id, def) {
    // def: { media: '...' } | { prefix: '...' } | { suffix: '...' }
    if ('media'  in def) this.add({ id, kind: 'variant-media',  query    : def.media  });
    if ('prefix' in def) this.add({ id, kind: 'variant-prefix', selector : def.prefix });
    if ('suffix' in def) this.add({ id, kind: 'variant-suffix', selector : def.suffix });
    return this;
  }

  defineShorthand (id, spec) {
    const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
    this.add({ id, kind: 'shorthand', declarations });
    return this;
  }

  // wandelt einen classcade-String in ein flaches { prop: value }-Objekt,
  // ohne Selector/Media-Wrapping - genutzt vom Normalizer für rekursive
  // Shorthand-Referenzen wie defineShorthand('ghost', 'bg[transparent]')
  resolveDeclOnly (source) {
    const ast   = this.parser.parse(source);
    const rules = this.resolver.resolve(ast);
    return rules.reduce((acc, r) => Object.assign(acc, r.declarations), {});
  }
}

/*
geht:

cc.definePropAlias('bg', 'background-color');
cc.definePropAlias('fg', 'color');
cc.defineFnAlias('ld', 'light-dark');

cc.defineShorthand('block',      { prop: 'display', value: 'block' });
cc.defineShorthand('sticky-top', [{ prop: 'position', value: 'sticky' }, { prop: 'top', value: '0' }]);
cc.defineShorthand('centered',   'display: flex; align-items: center; justify-content: center;');
cc.defineShorthand('ghost',      'bg[transparent]'); // rekursiv, nutzt den Property-Alias

*/

