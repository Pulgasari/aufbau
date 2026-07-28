import DeclarationNode from "../nodes/DeclarationNode.js";
import     RuleNode from "../nodes/RuleNode.js";
import    MediaNode from "../nodes/MediaNode.js";
import    LayerNode from "../nodes/LayerNode.js";
import PropertyNode from "../nodes/PropertyNode.js";

export default function NodeBuilder (node) {
  node.atRule = function (name, prelude = "") {
    const rule = new AtRuleNode(
      this.ass,
      name,
      prelude
    );
    this.append(rule);
    return rule;
  };
  node.rule = function (selector) {
    const rule = new RuleNode(this.ass, selector);
    this.append(rule);
    return rule;
  };
  node.layer = function (name) {
    const layer = new LayerNode(this.ass, name);
    this.append(layer);
    return layer;
  };
  node.media = function (query) {
    const media = new MediaNode(this.ass, query);
    this.append(media);
    return media;
  };
  node.prop = function (name, value) {
    const definition = this.ass.property(name);
    const property = definition ?? {
      cssName: name,
      format: value => value
    };
    const parsed = this.ass.parseValue(value, property);
    const declaration = new DeclarationNode(
      this.ass,
      property.cssName,
      parsed
    );
    this.append(declaration);
    return declaration;
  };
}
