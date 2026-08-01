// <aufbau-flag>

import AufbauElement from './AufbauElement.js';

export default class AufbauFlag extends AufbauElement {
  static attr = ['code', 'variant'];

  update() {
    const code    = (this.getAttr('code')   || 'de').toLowerCase();
    //const variant = this.getAttr('variant') || 'circle'; // 'circle' | 'square' | '4x3'
    const variant = this.getConfig('variant', 'flag-variant', 'circle');
    
    const iconSet = variant === 'circle' ? 'circle-flags' : 'flagpack';
    this.innerHTML = `<aufbau-icon icon="${iconSet}:${code}"></aufbau-icon>`;
  }
}

AufbauFlag.init();
