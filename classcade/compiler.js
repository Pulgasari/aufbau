// compiler.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Observer  from './observer.js';
import Parser    from './parser.js';
import Resolver  from './resolver.js';
import Scanner   from './scanner.js';

export class Compiler {

  constructor () {
    this.generator = new Generator;
    this.injector  = new Injector;
    this.observer  = new Observer (this);
    this.parser    = new Parser;
    this.scanner   = new Scanner ({ attributes: ['cc', 'class', 'classcade', 'className', 'data-classcade'] });    
    this.registry  = new Map;
    this.resolver  = new Resolver (this.registry);
  }

  // registry
  add (obj) { this.registry.set(obj.id, obj); return this; }
  get (id)  { return this.registry.get(id); }

  // runtime
  observe (target) { this.process(target); this.observer.start(); }
  stop () { this.observer.stop(); }
  process (root) {
    const entries = this.scanner.scan(root);
    
    for (const entry of entries) {
      const ast   = this.classcade.parse(entry.value);
      const rules = this.classcade.resolve(ast);

      for (const rule of rules) {
        if (this.classcade.injector.has(rule.id)) continue;

        const css = this.classcade.generate(rule);
        this.classcade.injector.inject(rule.id, css);
      }
    }
  }

  // process
  generate (input) { return this.generator.generate (input); }
  parse    (input) { return this.parser.parse       (input); }
  resolve  (input) { return this.resolver.resolve   (input); }

  use (preset) {
    preset(this);
    return this;
  }

}

export default Compiler;
