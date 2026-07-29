// generator.js

class Generator {

  constructor (options = {}) {
    this.options = {
      pretty: true,
      indent: "  ",
      ...options
    };
  }

  generate (nodes) {
    if (!Array.isArray(nodes)) nodes = [nodes];
    return nodes
         . map(node => this.generateRule(node))
         . filter(Boolean)
         . join(this.options.pretty ? "\n\n" : "");
  }

  generateRule (rule) {
    if (!rule?.selector) return '';

    const css = [];
    css.push(`${rule.selector}{`);
    for (const [property, value] of Object.entries(rule.declarations ?? {})) {
      css.push(
        this.options.pretty
          ? `${this.options.indent}${property}:${value};`
          : `${property}:${value};`
      );
    }
    css.push("}");

    let output = css.join(this.options.pretty ? "\n" : "");
    if (rule.media)    output = `@media `    + rule.media    + `{ ${output} }`;
    if (rule.supports) output = `@supports ` + rule.supports + `{ ${output} }`;
    if (rule.layer)    output = `@layer `    + rule.layer}   + `{ ${output} }`;    
    return output;
  }

}

export default Generator;
