import { dom } from './shared.js';


class AufbauElement {
  #mounted = false;
  
  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  connectedCallback () {
    this.#isMounted = true;
    
    adoptClassStyles(this.constructor, this.root === this ? this.getRootNode() : this.root);
    applySkin();
    this.on(window, CONFIG_EVENT, (event) => {
      if (this.#isMounted && this.observesConfig(event.detail?.changed)) this.update();
    });
    if (this.constructor.source) this.watchSource();
    
    this.onMount();
    this.update();
  }
  
  disconnectedCallback () {
    this.#isMounted = false;
    this.release();
    this.onUnmount();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (this.#isReflecting) return;
    if (oldValue !== newValue && this.#isMounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }

  static init (name) {
    const tag = (isString(name) ? name : name?.name) || toKebabCase(this.name);

    if (!tag.includes('-')) return log.warn(`invalid tag name "${tag}", custom elements require a hyphen.`);
    if (customElements.get(tag)) return;

    const observed = Object.keys(schemaOf(this));
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    customElements.define(tag, this);
  }

  // :::::: ACCESS CHILDREN
  get trees () { return this.shadowRoot ? [this.shadowRoot, this] : [this]; }

  $ (selector) {
    for (const tree of this.trees) {
      const found = tree.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  $$ (selector) { return this.trees.flatMap(tree => [...tree.querySelectorAll(selector)]); }
  part  (name) { return     this.root.querySelector   (`[part~="${name}"]`);  }
  parts (name) { return [...this.root.querySelectorAll(`[part~="${name}"]`)]; }

  // :::::: ACCESS STYLE-TOKENS (CSS CUSTOM PROPERTIES)
  getToken  (name, fallback) { return dom.getStyleToken  (name, this) ?? fallback; }
  setToken  (name, value)    { return dom.setStyleToken  (name, value, this); }
  getTokens (names)          { return dom.getStyleTokens (names, this); }
  setTokens (map)            { return dom.setStyleTokens (map, this); }
  
  // reflect every `var`-flagged attribute onto its css custom property
  applyVars () {
    for (const [name, entry] of Object.entries(this.schema)) {
      const key = entry.var === true ? name : entry.var;
      if (entry.var) this.setVar(key, this.getAttr(name));
    }
  }

}
