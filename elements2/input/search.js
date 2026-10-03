// <input-search>
// a search query. emits `search` with { query } once the typing paused, so a
// list can filter without reacting to every key. a search icon at the start
// and a clear button at the end, both can be set: icon="false", actions="paste clear"
//
//   <input-search name="q" debounce="300"></input-search>
//   element.addEventListener('search', event => filter(event.detail.query));

import { InputValue } from '../core/InputValue.js';

export class InputSearch extends InputValue {
  static type = 'search';

  static attr = {
    debounce    : { type: Number, default: 250 },
    placeholder : 'search…',
  };

  onMount () {
    super.onMount();
    this.on('input', () => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.emit('search', { query: this.value }), this.getAttr('debounce'));
    });
  }

  onUnmount () {
    super.onUnmount();
    clearTimeout(this._timer);
  }
}

InputSearch.init('input-search');
export default InputSearch;
