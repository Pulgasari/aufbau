import PropertyRegistry from "./registries/PropertyRegistry.js";

export default class ASS {

    props;

    constructor() {

        this.props = new PropertyRegistry(this);

    }

}

import SheetNode from "./nodes/SheetNode.js";
import Registry from "./core/Registry.js";

export default class ASS{

    sheet = new SheetNode();

    registry = new Registry();

}
