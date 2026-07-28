import ASSNode from "../core/ASSNode.js";

export default class ThemeNode extends ASSNode {

  constructor (ass, name) {
    super(ass, "theme", name);
    this.data.name = name;
  }

}
