// classcade.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Registry  from './registry.js';
import Resolver  from './resolver.js';
import Runtime   from './runtime.js';

class Classcade {

  constructor (options={}) {
    this.options   = options;
    this.generator = new Generator;
    this.injector  = new Injector;
    this.registry  = new Registry;
    this.resolver  = new Resolver (this.registry);
    this.runtime   = new Runtime  (this);
  }
  
  addMethod  (obj) { this.registry.addMethod  (obj); return this; }
  addRule    (obj) { this.registry.addRule    (obj); return this; }
  addVariant (obj) { this.registry.addVariant (obj); return this; }

  start () { this.runtime.start(); }
  stop  () { this.runtime.stop();  }

  use (preset){
    preset(this);
    return this;
  }

}

export default Classcade;
