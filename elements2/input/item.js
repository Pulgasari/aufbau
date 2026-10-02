// <input-item>
// one of a list of items, or several with `multiple`. the list comes from the
// children (<aufbau-option>, <option>) or from `src`, a json file.
//
//   <input-item name="size" look="segments">
//     <aufbau-option value="s">small</aufbau-option>
//     <aufbau-option value="l">large</aufbau-option>
//   </input-item>
//   <input-item name="tag" src="/tags.json" multiple></input-item>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-picker>'s.

import { OptionsComponent } from '../core/OptionsComponent.js';

export class InputItem extends OptionsComponent {

  static attr = {
    iconsOnly  : Boolean,
    multiple   : Boolean,
    searchable : Boolean,
    src        : String,
  };

  static forward = [...OptionsComponent.forward, 'iconsOnly', 'multiple', 'src'];

  // the author's options, taken before the first render replaces the children
  onMount () {
    this._authored ??= [...this.children];
    super.onMount();
  }

  onRender () {
    this.control?.append(...(this._authored ?? []));
    super.onRender();
  }

  // the options are the author's, nothing is built
  entries () { return null; }
}

InputItem.init('input-item');

export default InputItem;
