// <aufbau-flag>

import AufbauElement from './AufbauElement.js';

export class AufbauFlag extends AufbauElement {
  static get observedAttributes() {
    return ['code', 'variant'];
  }

  update() {
    const code    = (this.getAttribute('code')   || 'de').toLowerCase();
    //const variant = this.getAttribute('variant') || 'circle'; // 'circle' | 'square' | '4x3'
    const variant = this.getConfig('variant', 'flag-variant', 'circle');
    
    const iconSet = variant === 'circle' ? 'circle-flags' : 'flagpack';
    this.innerHTML = `<aufbau-icon icon="${iconSet}:${code}"></aufbau-icon>`;
  }
}

customElements.define('aufbau-flag', AufbauFlag);
export default AufbauFlag;
