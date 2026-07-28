import ASSNode from "../core/ASSNode.js";

export default class MediaNode extends ASSNode {

  constructor (ass, query) {
    super(ass, "media", query);
    this.data.query = query;
  }

  get query () {
    return this.data.query;
  }

}
