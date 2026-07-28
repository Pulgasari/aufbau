import PropertyRegistry from "./registries/PropertyRegistry.js";

export default class ASS {

    props;

    constructor() {

        this.props = new PropertyRegistry(this);

    }

}
