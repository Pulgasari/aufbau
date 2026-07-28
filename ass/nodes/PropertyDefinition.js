export default class PropertyDefinition {
  constructor (ass, name, config = {}) {
    this.ass = ass;
    this.name = name;
    this.config = config;
    this.registered = false;
  }
  get cssName () {
    return this.config.css ?? this.config.name ?? this.name;
  }
  get syntax () {
    return this.config.syntax;
  }
  get initial () {
    return this.config.initial;
  }
  get inherits () {
    return this.config.inherits ?? true;
  }
  format (value) {
    if (typeof value !== "number") {
      return value;
    }
    if (!this.config.unit) {
      return value;
    }
    return `${value}${this.config.unit}`;
  }
  canRegister () {
    return Boolean(
      this.cssName.startsWith("--") &&
      this.syntax &&
      this.initial !== undefined
    );
  }
  register () {
    if (this.registered) {
      return this;
    }
    if (!this.canRegister()) {
      return this;
    }
    if (!globalThis.CSS?.registerProperty) {
      return this;
    }
    CSS.registerProperty({
      name: this.cssName,
      syntax: this.syntax,
      inherits: this.inherits,
      initialValue: this.format(this.initial)
    });
    this.registered = true;
    return this;
  }
},
