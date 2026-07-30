// injector.js

class Injector {

  constructor (id = 'classcade') {
    this.id      = id;
    this.cache   = new Set;
    this.element = document.querySelector(`style[data-classcade="${id}"]`) ?? this.createStyleElement();    
  }

  createStyleElement () {
    const element = document.createElement('style');
    element.dataset.classcade = this.id;
    document.head.appendChild(element);
    return element;
  }

  inject (id, code) {
    if (this.cache.has(id)) return false;
    this.cache.add(id);
    this.element.append(document.createTextNode(code + '\n'));
    return true;
  }

  clear () {
    this.cache.clear();
    this.element.textContent = '';
  }

  destroy () {
    this.clear();
    this.element.remove();
  }

  has (id) {
    return this.cache.has(id);
  }

}

export default Injector;
