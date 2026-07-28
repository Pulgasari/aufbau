import        RuleNode from "./../nodes/RuleNode.js";
import DeclarationNode from "./../nodes/DeclarationNode.js";

export default class ASTImporter {
  constructor (ass) {
    this.ass = ass;
  }
  import (ast, parent = this.ass.sheet) {
    for (const child of ast.children) {
      this.visit(child, parent);
    }
    return this.ass;
  }
  visit (node, parent) {
    switch (node.type) {
      case "rule":
        return this.rule(node, parent);
      case "declaration":
        return this.declaration(node, parent);
    }
  }
  rule (node, parent) {
    const rule = new RuleNode(
      this.ass,
      node.selector
    );
    parent.append(rule);
    for (const child of node.children) {
      this.visit(child, rule);
    }
    return rule;
  }
  declaration (node, parent) {
    const declaration = new DeclarationNode(
      this.ass,
      node.property,
      node.value
    );
    parent.append(declaration);
    return declaration;
  }
}
