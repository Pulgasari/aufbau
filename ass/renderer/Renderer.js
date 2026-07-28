export default class Renderer {
  render (node) {
    return this.visit(node);
  }
  visit (node) {
    const method = `render${node.type[0].toUpperCase()}${node.type.slice(1)}`;
    if (!this[method]) {
      return "";
    }
    return this[method](node);
  }
}
