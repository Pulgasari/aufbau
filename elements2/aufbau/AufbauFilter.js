import '../input/tags.js';

import { AufbauElement }  from '../base/AufbauElement.js';
import { html }           from '../lib/html.js';
import { filterElements } from '@domina/methods/filterElements.js';

export default class AufbauFilter extends AufbauElement {
  static attr = {
    container     : String,
    debounce      : 100,
    mismatchClass : String,
    mode          : { type: String, default: 'contains', values: ['contains', 'startsWith', 'endsWith', 'exact'] },
    placeholder   : 'Filter...',
    target        : String,   // selector of the elements to filter
  };

  static styles = `aufbau-filter { display: block; > input-search { inline-size: 100%; } }`;

  onMount () {
    this.on('input', 'input-search', (event, input) => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.apply(input.value), this.getAttr('debounce'));
    });

    this.on('aufbau-filter-reset', () => this.apply(''));
  }

  onUnmount () { clearTimeout(this._timer); }

  apply (query) {
    const { container, mismatchClass, mode, target } = this.getAttr();
    if (!target) return this;

    const result = filterElements({
      container : container || document,
      filters   : [['', query, mode]],
      hide      : !mismatchClass,
      item      : target,
      mismatchClass,
    });

    this.emit('aufbau-filter', { query, ...result });
    return this;
  }

  render () {
    return html`<input-search placeholder="${this.getAttr('placeholder')}"></input-search>`;
  }
}

AufbauFilter.init();
