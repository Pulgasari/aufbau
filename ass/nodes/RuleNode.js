import ASSNode from "../core/ASSNode.js";

export default class RuleNode extends ASSNode {

  constructor (ass, selector) {
    super(ass, "rule", selector);
    this.data.selector = selector;
  }

  get selector () {
    return this.data.selector;
  }

  set selector (value) {
    this.data.selector = value;
    this.markDirty();
  }

}
