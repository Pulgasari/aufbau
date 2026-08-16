// classes/StyleBuilder.js

import { RuleBuilder } from './RuleBuilder.js';

/**
 * Chainable Style Builder Engine.
 */
export class StyleBuilder {
  constructor() {
    this.rules = [];
  }

  rule(selector, callback) {
    const subBuilder = new RuleBuilder;
    callback(subBuilder);
    this.rules.push({ selector, styles: subBuilder.getStyles() });
    return this;
  }

  toCSS() {
    return this.rules.map(r => `${r.selector} {\n${r.styles.join('\n')}\n}`).join('\n');
  }
}

export default StyleBuilder;
