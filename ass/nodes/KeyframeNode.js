import ASSNode from "../core/ASSNode.js";

export default class KeyframeNode extends ASSNode {

  constructor (ass, step) {
    super(ass, "keyframe", step);
    this.data.step = step;
  }

}
