class Injector {

  constructor(id = "classcade") {

    this.id = id;

    this.cache = new Set();

    this.style =
      document.querySelector(`style[data-classcade="${id}"]`)
      ?? this.createStyle();

  }

  createStyle() {

    const style = document.createElement("style");

    style.dataset.classcade = this.id;

    document.head.appendChild(style);

    return style;

  }

  inject(css) {

    if (!css || this.cache.has(css))
      return false;

    this.cache.add(css);

    this.style.append(document.createTextNode(css + "\n"));

    return true;

  }

  clear() {

    this.cache.clear();

    this.style.textContent = "";

  }

  destroy() {

    this.clear();

    this.style.remove();

  }

}

export default Injector;
