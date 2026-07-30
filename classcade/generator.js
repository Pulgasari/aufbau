// generator.js

import { arrayfied } from './utils.js';

class Generator {
  generate (nodes) {
    return arrayfied(nodes).map(n => this.generateRule(n)).filter(Boolean).join('\n\n');
  }

  generateRule (rule) {
    if (!rule?.selector) return '';
    const decl  = Object.entries(rule.declarations ?? {});
    const lines = [`${rule.selector} {`];
    for (const [property, value] of decl) lines.push(`  ${property}: ${value};`);
    lines.push('}');

    let code = lines.join('\n');
    if (rule.media)    code = `@media ${rule.media} { ${code} }`;
    if (rule.supports) code = `@supports ${rule.supports} { ${code} }`;
    if (rule.layer)    code = `@layer ${rule.layer} { ${code} }`;
    return code;
  }
}

export default Generator;
