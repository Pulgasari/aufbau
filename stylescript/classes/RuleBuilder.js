// classes/RuleBuilder.js

import { resolveDeclaration } from './../methods/resolveDeclaration.js';

export class RuleBuilder {
  constructor (context) {
    this.context      = context;
    this.declarations = [];
  }

  set (prop, value) {
    if (typeof prop === 'object') {
      for (const [key, val] of Object.entries(prop)) this.set(key, val);
    } else {
      const [cssProp, cssValue] = resolveDeclaration(prop, value, this.context);
      this.declarations.push(`  ${cssProp}: ${cssValue};`);
    }
    return this;
  }

  use (trait) {
    return this.set(trait);
  }

  flex (direction = 'row', align = 'stretch') {
    return this.set({ display: 'flex', flexDirection: direction, alignItems: align });
  }

  getStyles () {
    return this.declarations;
  }
}

export default RuleBuilder;
