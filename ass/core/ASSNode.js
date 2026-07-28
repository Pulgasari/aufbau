let NEXT_ID = 1;

export default class ASSNode {

  #ass;

  id = NEXT_ID++;

  type;

  name;

  parent = null;

  children = [];

  data = {};

  meta = {};

  state = {
    dirty: false
  };

  constructor (ass, type, name, data = {}) {

    this.#ass = ass;

    this.type = type;
    this.name = name;
    this.data = data;

  }

  get ass () {
    return this.#ass;
  }

  append (...nodes) {

    for (const node of nodes) {

      node.remove();

      node.parent = this;

      this.children.push(node);

    }

    this.markDirty();

    return this;

  }

  prepend (...nodes) {

    for (const node of [...nodes].reverse()) {

      node.remove();

      node.parent = this;

      this.children.unshift(node);

    }

    this.markDirty();

    return this;

  }

  remove () {

    if (!this.parent) {
      return this;
    }

    const children = this.parent.children;
    const index = children.indexOf(this);

    if (index !== -1) {
      children.splice(index, 1);
    }

    this.parent.markDirty();

    this.parent = null;

    return this;

  }

  clear () {

    for (const child of this.children) {
      child.parent = null;
    }

    this.children.length = 0;

    this.markDirty();

    return this;

  }

  markDirty () {

    if (this.state.dirty) {
      return this;
    }
  
    this.state.dirty = true;
  
    if (this.parent) {
      this.parent.markDirty();
    }
  
    this.ass.dirty();
  
    return this;

  }

  clean () {

    this.state.dirty = false;

    for (const child of this.children) {
      child.clean();
    }

    return this;

  }

  find (predicate) {

    for (const child of this.children) {

      if (predicate(child)) {
        return child;
      }

      const result = child.find(predicate);

      if (result) {
        return result;
      }

    }

    return null;

  }

  findAll (predicate, results = []) {

    for (const child of this.children) {

      if (predicate(child)) {
        results.push(child);
      }

      child.findAll(predicate, results);

    }

    return results;

  }

  }
