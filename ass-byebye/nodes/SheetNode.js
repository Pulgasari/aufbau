import ASSNode from "../core/ASSNode.js";

export default class SheetNode extends ASSNode {
  constructor (ass) {
    super(ass, "sheet", "root");
  }
}
