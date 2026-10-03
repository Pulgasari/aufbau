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

>
