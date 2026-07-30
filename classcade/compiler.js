// compiler.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Observer  from './observer.js';
import Parser    from './parser.js';
import Resolver  from './resolver.js';
import Scanner   from './scanner.js';

const config = {
  attributes: ['cc', 'class', 'classcade', 'className', 'data-classcade'],
}

export class Compiler {

  constructor () {
    this.generator = new Generator;
    this.injector  = new Injector;
    this.observer  = new Observer (this);
    this.parser    = new Parser;
    this.scanner   = new Scanner ({ attributes: config.attributes });    
    this.registry  = new Map;
    this.resolver  = new Resolver (this.registry);
  }

  // register
  add (obj) { this.registry.set(obj.id, obj); return this; }
  get (id)  { return this.registry.get(id); }

  // observe
  startObserver () { this.observer.start (); }
  stopObserver  () { this.observer.stop  (); }
  

  // process
  inject   (id, code) { return this.injector.inject (id, code); }
  generate (input)    { return this.generator.generate (input); }
  parse    (input)    { return this.parser.parse       (input); }
  resolve  (input)    { return this.resolver.resolve   (input); }
  scan     (input)    { return this.scanner.scan       (input); }
  process  (input) {
    const entries = this.scan(input);
    
    for (const { value } of entries) {
      const ast   = this.parse(value);
      const rules = this.resolve(ast);

      for (const rule of rules) {
        if (this.injector.has(rule.id)) continue;

        const css = this.generate(rule);
        this.inject(rule.id, css);
      }
    }
  }
  

  use (preset) {
    preset(this);
    return this;
  }

}

export default Compiler;
