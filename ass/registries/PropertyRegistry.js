import Registry from "../core/Registry.js";
import Property from "../objects/Property.js";
import { normalizeName } from "../core/normalize.js";
import PropertyDefinition from "../nodes/PropertyDefinition.js";


export default class PropertyRegistry {
  #ass;
  #properties = new Map();
  constructor (ass) {
    this.#ass = ass;
  }
  register (name, config = {}) {
    const property = new PropertyDefinition(this.#ass, name, config);
    property.register();
    this.#properties.set(normalizeName(name), property);
    if (config.aliases) {
      for (const alias of config.aliases) {
        this.#properties.set(normalizeName(alias), property);
      }
    }
    return property;
  }
  resolve (name) {
    return this.#properties.get(normalizeName(name));
  }
  has (name) {
    return this.#properties.has(normalizeName(name));
  }
}
