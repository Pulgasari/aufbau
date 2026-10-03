import './input/tags.js';

import { filterElements } from '@domina/methods/filterElements.js';
import { debounce }       from '@pulgasari/timing';

import { AufbauElement } from '@aufbau/element';
import { html }          from '../lib/html.js';

export default class DataFilter extends AufbauElement {
  static attr = {
    container     : String,
    debounce      : 100,
    mismatchClass : String,
    mode          : { type: String, default: 'contains', values: ['contains', 'startsWith', 'endsWith', 'exact'] },
    placeholder   : 'Filter...',
    target        : String,   // selector of the elements to filter
  };

  static styles = `data-filter { display: block; > input-search { inline-size: 100%; } }`;

  onConnected () {
    const apply = debounce(query => this.apply(query), this.getAttr('debounce'));
    this.track(apply.cancel);
    this.on('input', 'input-search', (event, input) => apply(input.value));

    this.on('data-filter-reset', () => this.apply(''));
  }

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

    this.emit('data-filter', { query, ...result });
    return this;
  }

  render () {
    return html`<input-search placeholder="${this.getAttr('placeholder')}"></input-search>`;
  }
}

DataFilter.init();
