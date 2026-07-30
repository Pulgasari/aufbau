// generator.js

import { arrayfied } from './utils.js';

class Generator {

  constructor () {}

  generate (nodes) {
    return arrayfied(nodes).map(this.generateRule).filter(Boolean).join('\n\n');
  }

  generateRule (rule) {
    if (!rule?.selector) return '';
    const decl = Object.entries(rule.declarations ?? {};
    const code = [];
    
    code.push(`${rule.selector} {`);
    for (const [property, value] of decl)) code.push(`${property}: ${value};`);
    code.push('}');

    code = code.join('\n');
    if (rule.media)    code = `@media `    + rule.media    + `{ ${code} }`;
    if (rule.supports) code = `@supports ` + rule.supports + `{ ${code} }`;
    if (rule.layer)    code = `@layer `    + rule.layer}   + `{ ${code} }`;    
    return code;
  }

}

export default Generator;
