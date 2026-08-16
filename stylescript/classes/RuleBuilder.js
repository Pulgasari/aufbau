// classes/RuleBuilder.js

export class RuleBuilder {
  constructor() {
    this.declarations = [];
  }

  set(prop, value) {
    if (typeof prop === 'object') {
      for (const [k, v] of Object.entries(prop)) {
        this.set(k, v);
      }
    } else {
      const cssProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      this.declarations.push(`  ${cssProp}: ${value};`);
    }
    return this;
  }

  use(trait) {
    return this.set(trait);
  }

  flex(direction = 'row', align = 'stretch') {
    return this.set({ display: 'flex', flexDirection: direction, alignItems: align });
  }

  getStyles() {
    return this.declarations;
  }
}

export default RuleBuilder;
