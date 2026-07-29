// injector.js

class Injector {

  constructor (id = 'classcade') {
    this.id    = id;
    this.cache = new Set;
    this.style = document.querySelector(`style[data-classcade="${id}"]`) ?? this.createStyleElement();    
  }

  createStyleElement () {
    const element = document.createElement('style');
    element.dataset.classcade = this.id;
    document.head.appendChild(element);
    return style;
  }

  inject (id, code) {
    if (this.cache.has(id)) return false;
    this.cache.add(id);
    this.style.append(document.createTextNode(code + '\n'));
    return true;
  }

  clear () {
    this.cache.clear();
    this.style.textContent = '';
  }

  destroy () {
    this.clear();
    this.style.remove();
  }

  has (id) {
    return this.cache.has(id);
  }

}

export default Injector;
