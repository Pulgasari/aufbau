// compiler.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Parser    from './parser.js';
import Resolver  from './resolver.js';
import Runtime   from './runtime.js';

class Classcade {

  constructor () {
    this.generator = new Generator;
    this.injector  = new Injector;
    this.parser    = new Parser;
    this.registry  = new Map;
    this.resolver  = new Resolver (this.registry);
    this.runtime   = new Runtime  (this);
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

export default Classcade;
