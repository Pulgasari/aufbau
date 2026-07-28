import Registry from "../core/Registry.js";
import Property from "../objects/Property.js";

export default class PropertyRegistry extends Registry {

    register(name, config = {}) {

        config.name ??= name;

        const prop = new Property(this.ass, config);

        this.add(name, prop);

        return prop;

    }

}
