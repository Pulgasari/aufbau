import DeclarationNode from "./DeclarationNode.js";

export default class PropertyNode extends DeclarationNode {

  constructor (ass, name, config = {}) {
    super(ass, name, config.initial);

    this.type = "property";

    this.meta = config;
  }

  set (value) {
    this.value = value;
    return this;
  }

  reset () {
    this.value = this.meta.initial;
    return this;
  }

}
