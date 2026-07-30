// presets/variants.js
import { breakpoints } from './tokens.js';

export default function variantsPreset (cc) {
  cc.add({ id: 'hover',         suffix: ':hover' });
  cc.add({ id: 'focus',         suffix: ':focus' });
  cc.add({ id: 'focus-within',  suffix: ':focus-within' });
  cc.add({ id: 'active',        suffix: ':active' });
  cc.add({ id: 'disabled',      suffix: ':disabled' });
  cc.add({ id: 'visited',       suffix: ':visited' });
  cc.add({ id: 'checked',       suffix: ':checked' });
  cc.add({ id: 'first',         suffix: ':first-child' });
  cc.add({ id: 'last',          suffix: ':last-child' });
  cc.add({ id: 'odd',           suffix: ':nth-child(odd)' });
  cc.add({ id: 'even',          suffix: ':nth-child(even)' });

  cc.add({ id: 'dark', prefix: '[data-theme="dark"] ' });

  for (const [name, query] of Object.entries(breakpoints)) {
    cc.add({ id: name, media: query });
  }
}
