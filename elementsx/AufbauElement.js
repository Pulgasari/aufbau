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

  // :::::: EVENTS
  on   (...args) { return   dom.onEvent(this, ...args); }
  emit (...args) { return dom.emitEvent(this, ...args); }

  // :::::: ACCESS ATTRIBUTES
  hasAttr (name) { return dom.hasAttr(this, name); }
  setAttr (map)  { dom.setAttr(this, map); return this; }
  getAttr (nameOrType, type, fallback) {
    if (!isString(nameOrType)) return this._attrProxy(isFn(nameOrType) ? nameOrType : null);

    const kebab  = toKebabCase(nameOrType);
    const parsed = this.schema[kebab] ?? BASE;

    const finalType     = isFn(type)          ? type     : parsed.type;
    const finalFallback = isDefined(fallback) ? fallback : parsed.fallback;
    const fromConfig    = () => parsed.config ? resolveConfig(this.tag, kebab, parsed.config) : undefined;

    if (finalType === Boolean) {
      if (this.hasAttribute(kebab)) return true;
      const configured = fromConfig();
      return configured === undefined ? (finalFallback ?? false) : toBoolean(configured);
    }

    const raw = this.hasAttribute(kebab) ? this.getAttribute(kebab) : fromConfig();
    if (raw == null) return finalFallback;

    let value = coerce(raw, finalType, finalFallback);

    if (parsed.values && !parsed.values.includes(value)) value = finalFallback;

    if (parsed.fn) {
      try   { value = parsed.fn.call(this, value, nameOrType); }
      catch { value = finalFallback; }
    }

    return value;
  }

  _attrProxy (overrideType) {
    const names = Object.keys(this.schema);

    return new Proxy ({}, {
      get     : (target, prop) => isString(prop) ?  this.getAttr(prop, overrideType) : undefined,
      has     : (target, prop) => isString(prop) && this.hasAttr(prop),
      ownKeys : () => names.map(toCamelCase),
      getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true }),
    });
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
