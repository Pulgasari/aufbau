// <aufbau-flag>

import { AufbauElement } from './core/AufbauCore.js';

export default class AufbauFlag extends AufbauElement {
  static attr = {
    code    : 'de',
    variant : 'circle', // 'circle' | 'square' | '4x3'
  };

  update() {
    const code    = (this.getAttr('code')).toLowerCase();
    const variant = this.getConfig('variant', 'flag-variant', 'circle');
    const iconSet = variant === 'circle' ? 'circle-flags' : 'flagpack';
    
    this.innerHTML = `<aufbau-icon icon="${iconSet}:${code}"></aufbau-icon>`;
  }
}

AufbauFlag.init();
