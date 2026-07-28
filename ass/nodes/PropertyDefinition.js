export default class PropertyDefinition {
  constructor (ass, name, config = {}) {
    this.ass = ass;
    this.name = name;
    this.config = config;
  }
  get cssName () {
    return this.config.css ?? this.config.name ?? this.name;
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
}
