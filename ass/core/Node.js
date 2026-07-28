let NEXT_ID = 0;

export default class Node {

  id = ++NEXT_ID;
  name;
  type;
  
  parent   = null;
  children = [];
  data     = {};
  meta     = {};
  state    = {};

  constructor (type, name, data = {}) {
    this.type = type;
    this.name = name;
    this.data = data;
  }

  append (...nodes) {
    for (const node of nodes) {
      node.remove();
      node.parent = this;
      this.children.push(node);
    }
    return this;
  }

  prepend (...nodes) {
    for (const node of nodes.reverse()) {
      node.remove();
      node.parent = this;
      this.children.unshift(node);
    }
    return this;
  }

  remove() {
    if (!this.parent) return this;
    const list = this.parent.children;
    list.splice(list.indexOf(this),1);
    this.parent = null;
    return this;
  }

  clear() {
    for (const child of this.children) {
      child.parent = null;
    }
    this.children.length = 0;
    return this;
  }

}
