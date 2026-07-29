// runtime.js

class Runtime {

  constructor (classcade) {
    this.classcade = classcade;
    this.observer  = new Observer (this);
    this.scanner   = new Scanner({ attributes: classcade.options.attributes });   
  }

  start () {
    this.process(document);
    this.observer.start();
  }

  stop () {
    this.observer.stop();
  }

  process (root) {
    const entries = this.scanner.scan(root);
    
    for (const entry of entries) {
      const ast   = this.classcade.options.parser.parse(entry.value);
      const rules = this.classcade.resolver.resolve(ast);

      for (const rule of rules) {
        if (this.classcade.injector.has(rule.id)) continue;

        const css = this.classcade.generator.generate(rule);
        this.classcade.injector.inject(rule.id, css);
      }
    }
  }

}

export default Runtime;
