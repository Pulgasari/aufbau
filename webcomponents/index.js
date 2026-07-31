// Class for the container index element
class AufbauIndex extends HTMLElement {
  static get observedAttributes() {
    return ['item-size', 'item-shape', 'gap'];
  }

  attributeChangedCallback () { this.updateProperties(); }
  connectedCallback        () { this.updateProperties(); }
  
  updateProperties () {
    const size  = this.getAttribute('item-size');
    const shape = this.getAttribute('item-shape');
    const gap   = this.getAttribute('gap');

    if (size)  this.style.setProperty('--aufbau-item-size', size);
    if (shape) this.style.setProperty('--aufbau-item-shape', this.resolveShape(shape));
    if (gap)   this.style.setProperty('--aufbau-gap', gap);
  }

  resolveShape (shape) {
    const shapes = {
      circle: '50%',
      square: '0px',
      rounded: '12px',
      squircle: '24% / 50%'
    };
    return shapes[shape] || shape;
  }
}

// Class for child item overrides
class AufbauItem extends HTMLElement {
  static get observedAttributes() {
    return ['shape'];
  }

  connectedCallback() {
    this.updateShape();
  }

  attributeChangedCallback() {
    this.updateShape();
  }

  updateShape() {
    const shape = this.getAttribute('shape');
    if (shape) {
      const shapes = {
        circle: '50%',
        square: '0px',
        rounded: '12px',
        squircle: '24% / 50%'
      };
      this.style.setProperty('--aufbau-current-shape', shapes[shape] || shape);
    }
  }
}

// Register custom elements
if (typeof window !== 'undefined') {
  if (!customElements.get('aufbau-index')) customElements.define('aufbau-index', AufbauIndex);    
  if (!customElements.get('aufbau-item'))  customElements.define('aufbau-item', AufbauItem);
}



