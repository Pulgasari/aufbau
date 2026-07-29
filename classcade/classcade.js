// classcade.js

import Generator from 'generator.js';
import Injector  from 'injector.js';
import Registry  from 'registry.js';
import Resolver  from 'resolver.js';
import Runtime   from 'runtime.js';

class Classcade {

  constructor (options={}) {
    this.options   = options;
    this.generator = new Generator;
    this.injector  = new Injector;
    this.registry  = new Registry;
    this.resolver  = new Resolver (this.registry);
    this.runtime   = new Runtime  (this);
  }
  
  method  (id) { this.registry.method  (id); return this; }
  rule    (id) { this.registry.rule    (id); return this; }
  variant (id) { this.registry.variant (id); return this; }

  start () { this.runtime.start(); }
  stop  () { this.runtime.stop();  }

}

export default Classcade;
