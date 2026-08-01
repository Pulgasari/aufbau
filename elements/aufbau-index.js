// <aufbau-index>

export class AufbauIndex extends HTMLElement {
  static get observedAttributes() {
    return ['item-size', 'item-shape', 'item-look', 'gap'];
  }

  connectedCallback() {
    this.updateProperties();
  }

  attributeChangedCallback() {
    this.updateProperties();
  }

  updateProperties() {
    // 1. Parse shorthand attribute
    const look = parseLook(this.getAttribute('item-look'));

    // 2. Explicit attributes override shorthand values
    const size  = this.getAttribute('item-size')  || look.size;
    const shape = this.getAttribute('item-shape') || look.shape;
    const gap   = this.getAttribute('gap');

    if (size)  this.style.setProperty('--aufbau-item-size', size);
    if (shape) this.style.setProperty('--aufbau-item-shape', this.resolveShape(shape));
    if (gap)   this.style.setProperty('--aufbau-gap', gap);
  }

  resolveShape(shape) {
    const shapes = {
      circle: '50%',
      square: '0px',
      rounded: '12px',
      squircle: '24% / 50%'
    };
    return shapes[shape] || shape;
  }
}

export default AufbauIndex;
