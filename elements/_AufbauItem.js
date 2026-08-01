export class AufbauItem extends HTMLElement {
  static get observedAttributes() {
    return ['shape', 'look'];
  }

  connectedCallback() {
    this.updateProperties();
  }

  attributeChangedCallback() {
    this.updateProperties();
  }

  updateProperties() {
    const look = parseLook(this.getAttribute('look'));
    const shape = this.getAttribute('shape') || look.shape;

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

