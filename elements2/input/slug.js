// <input-slug>
// a slug for urls and ids: lowercase latin letters, digits and dashes. what is
// typed is turned into one when the field is left: 'Über uns!' -> 'ueber-uns'.
// with `source` it follows another field until it is edited by hand.
//
//   <input-slug name="slug" source="[name='title']"></input-slug>

import { InputValue } from '../core/InputValue.js';
import { slugify }    from '../core/valueTypes.js';

export class InputSlug extends InputValue {
  static type = 'slug';

  static attr = {
    source : String,   // a selector, searched in the form first, then in the document
  };

  get sourceElement () {
    const selector = this.getAttr('source');
    if (!selector) return null;
    return (this.closest('form') ?? document).querySelector(selector) ?? document.querySelector(selector);
  }

  onMount () {
    super.onMount();

    // typing in the slug itself ends the following
    this.on(this.root, 'keydown', event => { if (event.key !== 'Tab') this._edited = true; });

    const source = this.sourceElement;
    if (source) this.on(source, 'input', () => { if (!this._edited) this.commit(slugify(source.value)); });
  }
}

InputSlug.init('input-slug');
export default InputSlug;
