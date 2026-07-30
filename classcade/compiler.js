// compiler.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Observer  from './observer.js';
import Parser    from './parser.js';
import Resolver  from './resolver.js';
import Scanner   from './scanner.js';

class Compiler {

  constructor () {
    this.generator = new Generator;
    this.injector  = new Injector;
    this.observer  = new Observer;
    this.parser    = new Parser;
    this.scanner   = new Scanner ({ attributes: ['cc', 'class', 'classcade', 'className', 'data-classcade'] });    
    this.registry  = new Map;
    this.resolver  = new Resolver (this.registry);
  }

  // registry
  add (obj) { this.registry.set(obj.id, obj); return this; }
  get (id)  { return this.registry.get(id); }

  // runtime
  start () { this.runtime.start(); }
  stop  () { this.runtime.stop();  }

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
