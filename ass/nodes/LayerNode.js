import ASSNode from "../core/ASSNode.js";

export default class LayerNode extends ASSNode {

  constructor (ass, name) {
    super(ass, "layer", name);
    this.data.name = name;
  }

  get name () {
    return this.data.name;
  }

}
