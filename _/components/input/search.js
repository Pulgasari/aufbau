// <input-search>
// a search query. emits `search` with { query } once the typing paused, so a
// list can filter without reacting to every key.
//
//   <input-search name="q" debounce="300"></input-search>
//   element.addEventListener('search', event => filter(event.detail.query));
//
// a search icon at the start and a clear button at the end by default, both
// can be set like on any input: icon="false", actions="paste clear"

import { InputComponent } from '../core/InputComponent.js';
import { define }         from '../core/names.js';

export class InputSearch extends InputComponent {

  static attr = {
    actions     : { type: String, default: 'clear' },
    debounce    : { type: Number, default: 250 },
    icon        : { type: String, default: 'lucide:search' },
    placeholder : 'search…',
  };

  bind () {
    this.on(this.control, 'input', event => {
      if (event.target !== this.control) return;
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.emit('search', { query: this.value }), this.getAttr('debounce'));
    });
  }

  onUnmount () { clearTimeout(this._timer); }
}

define('input-search', InputSearch);

export default InputSearch;
