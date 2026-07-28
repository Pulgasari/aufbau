import ASSNode from "../core/ASSNode.js";

export default class DeclarationNode extends ASSNode {

  constructor (ass, property, value) {
    super(ass, "declaration", property);

    this.data.property = property;
    this.data.value = value;
  }

  get property () {
    return this.data.property;
  }

  get value () {
    return this.data.value;
  }

  set value (value) {
    this.data.value = value;
    this.markDirty();
  }

}
