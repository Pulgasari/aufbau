// classes/StyleBuilder.js

import { RuleBuilder } from './RuleBuilder.js';

/**
 * Chainable Style Builder Engine.
 */
export class StyleBuilder {
  constructor (context) {
    this.context = context;
    this.rules   = [];
  }

  rule (selector, callback) {
    const subBuilder = new RuleBuilder(this.context);
    callback(subBuilder);
    this.rules.push({ selector, styles: subBuilder.getStyles() });
    return this;
  }

  toCSS () {
    return this.rules.map(rule => `${rule.selector} {\n${rule.styles.join('\n')}\n}`).join('\n');
  }
}

export default StyleBuilder;
