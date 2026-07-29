// compiler.js

class Compiler {

  constructor (classcade) {
    this.classcade = classcade;
  }

  compile (source) {

    if (!Array.isArray(source)) source = [source];

    const generated = new Set();
    const css = [];

    for (const html of source) {
      const entries = this.classcade.scanner.scanHTML(html);

      for (const entry of entries) {
        const ast   = this.classcade.options.parser.parse(entry.value);
        const rules = this.classcade.resolver.resolve(ast);

        for (const rule of rules) {
          if (generated.has(rule.id)) continue;
          generated.add(rule.id);
          css.push(this.classcade.generator.generate(rule));
        }

      }

    }

    return css.join("\n\n");
  }

}

export default Compiler;
