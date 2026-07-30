// compiler.js — Ergänzungen
import { normalizeSpec } from './spec-resolver.js';
import Normalizer from './normalizer.js';

class Registry {
  add (obj) {

  }
}

this.add({ id, kind: 'alias-prop', ref }); // definePropAlias
this.add({ id, kind: 'alias-fn',   ref }); // defineFnAlias
this.add({ id, kind: 'variant-media',  query    : def.media  });
this.add({ id, kind: 'variant-prefix', selector : def.prefix });
this.add({ id, kind: 'variant-suffix', selector : def.suffix });



const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
this.add({ id, kind: 'shorthand', declarations });

class Compiler {
  addAlias (kind, alias, reference) {
    kind = normalizeKind(kind)
    if (kind == null) return;

    this.add({ kind, id: alias, ref: reference });
    return this;
  }

  addVariant (kind, id, xxx) {
    kind = normalizeKind(kind)
    if (kind == null) return;

    if (kind === 'variant-media')  this.add({ kind, id, query: xxx });
    if (kind === 'variant-prefix') this.add({ kind, id, selector: xxx });
    if (kind === 'variant-suffix') this.add({ kind, id, selector: xxx });
    
    return this;
  }

  addShorthand (id, spec) {
    const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
    this.add({ id, kind: 'shorthand', declarations });
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
  resolveClasscadeDecl (source) {
    const ast   = this.parse(source);
    const rules = this.resolve(ast);
    return rules.reduce( (acc, r) => Object.assign(acc, r.declarations), {} );
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

