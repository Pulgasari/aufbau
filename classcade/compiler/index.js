// @classcade/compiler/index.js — Ergänzungen

import { normalizeSpec }         from './resolver.js';
import Normalizer, { normalize } from './normalizer.js';

class Registry {
  add (obj) {

  }
}





const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
this.add({ id, kind: 'shorthand', declarations });

class Compiler {
  
  addAlias (kind, alias, reference) {
    kind = normalize({ kind });
    if (kind) this.add({ kind, id: alias, ref: reference });
    return this;
  }

  addShorthand (id, spec) {
    const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
    this.add({ id, kind: 'shorthand', declarations });
    return this;
  }

  addVariant (kind, id, xxx) {
    switch (normalize({ kind })) {
      case 'variant-media'  : this.add({ kind, id, query:    xxx }); return this;
      case 'variant-prefix' : this.add({ kind, id, selector: xxx }); return this;
      case 'variant-suffix' : this.add({ kind, id, selector: xxx }); return this;
      default: return null;
    }
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

