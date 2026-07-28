import     RuleNode from "../nodes/RuleNode.js";
import    MediaNode from "../nodes/MediaNode.js";
import    LayerNode from "../nodes/LayerNode.js";
import PropertyNode from "../nodes/PropertyNode.js";

export default function NodeBuilder (node) {
  node.rule = function (selector) {
    const rule = new RuleNode(this.ass, selector);
    this.append(rule);
    return rule;
  };
  node.media = function (query) {
    const media = new MediaNode(this.ass, query);
    this.append(media);
    return media;
  };
  node.layer = function (name) {
    const layer = new LayerNode(this.ass, name);
    this.append(layer);
    return layer;
  };
  node.prop = function (name, value) {
    const prop = new PropertyNode(this.ass, name, {
      initial: value
    });
    this.append(prop);
    return prop;
  };
}
