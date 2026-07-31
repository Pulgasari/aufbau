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

  find(fn){

    for(const child of this.children){

        if(fn(child)) return child;

        const found = child.find(fn);

        if(found) return found;

    }

    return null;

}

findAll(fn){

    const out=[];

    const walk=node=>{

        for(const child of node.children){

            if(fn(child)) out.push(child);

            walk(child);

        }

    };

    walk(this);

    return out;

}

}
