import ASSNode from "../core/ASSNode.js";

export default class KeyframesNode extends ASSNode {

  constructor (ass, name) {
    super(ass, "keyframes", name);
    this.data.name = name;
  }

}
