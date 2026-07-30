// classcade.js

import Generator from './generator.js';
import Injector  from './injector.js';
import Resolver  from './resolver.js';
import Runtime   from './runtime.js';

class Classcade {

  constructor (options={}) {
    this.options   = options;
    this.generator = new Generator;
    this.injector  = new Injector;
    this.registry  = new Map;
    this.resolver  = new Resolver (this.registry);
    this.runtime   = new Runtime  (this);
  }

  add (obj) { this.registry.set(obj.id, obj); return this; }
  get (id)  { return this.registry.get(id); }
 
  start () { this.runtime.start(); }
  stop  () { this.runtime.stop();  }

  use (preset) {
    preset(this);
    return this;
  }

}

export default Classcade;
