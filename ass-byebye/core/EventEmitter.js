export default class EventEmitter {

  #listeners = new Map();

  on (type, listener) {

    if (!this.#listeners.has(type)) {
      this.#listeners.set(type, new Set());
    }

    this.#listeners.get(type).add(listener);

    return this;

  }

  off (type, listener) {

    const listeners = this.#listeners.get(type);

    if (!listeners) {
      return this;
    }

    listeners.delete(listener);

    if (!listeners.size) {
      this.#listeners.delete(type);
    }

    return this;

  }

  once (type, listener) {

    const callback = (...args) => {

      this.off(type, callback);

      listener(...args);

    };

    return this.on(type, callback);

  }

  emit (type, ...args) {

    const listeners = this.#listeners.get(type);

    if (!listeners) {
      return false;
    }

    for (const listener of listeners) {
      listener(...args);
    }

    return true;

  }

}
