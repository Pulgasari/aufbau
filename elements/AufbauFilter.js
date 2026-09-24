// <aufbau-filter>
// a search field that filters other elements by their text. the only child is
// an <aufbau-input type="search">. mismatches get the `hidden` attribute, so
// filtering works without any css; `mismatch-class` switches to a class instead.

import { AufbauElement } from './core/index.js';
import { html }          from './core/html.js';

const MATCH = {
  contains   : (text, query) => text.includes(query),
  endsWith   : (text, query) => text.endsWith(query),
  exact      : (text, query) => text === query,
  startsWith : (text, query) => text.startsWith(query),
};

export default class AufbauFilter extends AufbauElement {
  static attr = {
    container     : String,   // where to look for targets, the document by default
    debounce      : 100,
    mismatchClass : String,
    mode          : { type: String, default: 'contains', values: ['contains', 'startsWith', 'endsWith', 'exact'] },
    placeholder   : 'Filter...',
    target        : String,   // selector of the elements to filter
  };

  static styles = `aufbau-filter { display: block; > aufbau-input { inline-size: 100%; } }`;

  onMount () {
    // the value comes from the element, the native input event of the inner field carries no detail
    this.on('input', 'aufbau-input', (event, input) => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.apply(input.value), this.getAttr('debounce'));
    });

    this.on('aufbau-filter-reset', () => this.apply(''));
  }

  onUnmount () { clearTimeout(this._timer); }

  apply (query) {
    const { container, mismatchClass, mode, target } = this.getAttr();
    if (!target) return this;

    const scope  = container ? document.querySelector(container) : document;
    const items  = [...(scope?.querySelectorAll(target) ?? [])];
    const needle = String(query ?? '').trim().toLowerCase();
    const match  = MATCH[mode];
    const hits   = [];

    for (const item of items) {
      const matches = !needle || match(item.textContent.toLowerCase(), needle);
      if (mismatchClass) item.classList.toggle(mismatchClass, !matches);
      else item.hidden = !matches;
      if (matches) hits.push(item);
    }

    this.emit('aufbau-filter', { items: hits, matched: hits.length, query, total: items.length });
    return this;
  }

  render () {
    return html`<aufbau-input type="search" placeholder="${this.getAttr('placeholder')}"></aufbau-input>`;
  }
}

AufbauFilter.init();
