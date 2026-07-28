import ASSNode from "../core/ASSNode.js";

export default class ScopeNode extends ASSNode {

  constructor (ass, selector) {
    super(ass, "scope", selector);
    this.data.selector = selector;
  }

}
