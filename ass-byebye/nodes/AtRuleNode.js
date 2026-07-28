import ASSNode from "../core/ASSNode.js";

export default class AtRuleNode extends ASSNode {
  constructor (ass, name, prelude = "") {
    super(ass, "atRule", name);
    this.data.name    = name;
    this.data.prelude = prelude;
  }
  get name    () { return this.data.name;    }
  get prelude () { return this.data.prelude; }
}
