class Injector {

  constructor (id = 'classcade') {
    this.id    = id;
    this.cache = new Set();
    this.style = document.querySelector(`style[data-classcade="${id}"]`) ?? this.createStyleElement();    
  }

  createStyleElement () {
    const element = document.createElement('style');
    element.dataset.classcade = this.id;
    document.head.appendChild(element);
    return style;
  }

  inject (code) {
    if (!code || this.cache.has(code)) return false;
    this.cache.add(code);
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

}

export default Injector;
