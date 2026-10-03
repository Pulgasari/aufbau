// <input-font>
// a font of @aufbau/webfonts, as its id: 'manrope'. sorted by name across the
// categories of the catalog.
//
//   <input-font name="font" value="manrope"></input-font>
//   <input-font categories="sans serif"></input-font>

import { fonts } from '@aufbau/webfonts';

import { define }                            from '../core/names.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';

export class InputFont extends OptionsComponent {

  static attr = {
    categories  : String,   // space separated catalog categories, all when absent
    placeholder : 'font…',
  };

  optionsKey () { return this.getAttr('categories') ?? ''; }

  entries (locale) {
    const categories = listOf(this.getAttr('categories'), null);

    return fonts
      .filter(font => !categories || categories.includes(font.category))
      .map(font => ({ label: font.name, value: font.id }))
      .sort(byLabel(locale));
  }
}

define('input-font', InputFont);

export default InputFont;
