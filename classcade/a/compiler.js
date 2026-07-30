// compiler.js — Ergänzung
import { normalizeSpec } from './normalizer.js';

class Compiler {
  ...
  defineShorthand (id, spec) {
    const declarations = normalizeSpec(spec, str => this.resolveDeclOnly(str));
    this.add({ id, type: 'shorthand', declarations });
    return this;
  }

  // wandelt einen classcade-String in ein flaches { prop: value }-Objekt,
  // ohne Selector/Media-Wrapping - genutzt vom Normalizer für Shorthand-Referenzen
  resolveDeclOnly (source) {
    const ast   = this.parser.parse(source);
    const rules = this.resolver.resolve(ast);
    return rules.reduce((acc, r) => Object.assign(acc, r.declarations), {});
  }
}
