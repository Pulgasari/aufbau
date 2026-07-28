import Renderer from "./Renderer.js";

export default class CSSRenderer extends Renderer {
  renderAtRule (node) {
    const body = node.children
      .map(child => this.visit(child))
      .join("\n");
    if (!body) {
      return `@${node.name} ${node.prelude};`;
    }
    return `@${node.name} ${node.prelude} {\n${body}\n}`;
  }
  
  renderSheet (node) {
    return node.children.map(child => this.visit(child)).join("\n");
  }
  
  renderRule (node) {
    const body = node.children.map(child => this.visit(child)).join("\n");
    return `${node.selector} {\n${body}\n}`;
  }
  renderDeclaration (node) {
    return `  ${node.property}: ${node.value};`;
  }
  renderProperty (node) {
    return this.renderDeclaration(node);
  }
  renderMedia (node) {
    const body = node.children.map(child => this.visit(child)).join("\n");
    return `@media ${node.query} {\n${body}\n}`;
  }
  renderLayer (node) {
    const body = node.children.map(child => this.visit(child)).join("\n");
    return `@layer ${node.name} {\n${body}\n}`;
  }

  
}
