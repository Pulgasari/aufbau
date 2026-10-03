// <input-slug>
// a slug for urls and ids: lowercase latin letters, digits and dashes. what is
// typed is turned into one when the field is left: 'Über uns!' -> 'ueber-uns'.
// with `source` it follows another field until it is edited by hand.
//
//   <input-slug name="slug" source="[name='title']"></input-slug>

import { InputComponent } from '../core/InputComponent.js';
import { define }         from '../core/names.js';

const SPELLED = { ä: 'ae', ö: 'oe', ß: 'ss', ü: 'ue' };

/** 'Über uns!' -> 'ueber-uns' */
export const slugify = value => String(value ?? '')
  .toLowerCase()
  .replace(/[äöüß]/g, char => SPELLED[char])
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export class InputSlug extends InputComponent {

  static attr = {
    source : String,   // a selector, searched in the form first, then in the document
  };

  get sourceElement () {
    const selector = this.getAttr('source');
    if (!selector) return null;
    const scope = this.closest('form') ?? document;
    return scope.querySelector(selector) ?? document.querySelector(selector);
  }

  bind () {
    this.on(this.control, 'change', event => {
      if (event.target !== this.control) return;
      const slug = slugify(this.value);
      if (slug !== this.value) this.control.commit(slug);
    });

    // typing in the slug itself ends the following. only typing reaches the
    // inner <input>, a commit is announced by the control itself
    this.on(this.control, 'input', event => { if (event.target !== this.control) this._edited = true; });

    const source = this.sourceElement;
    if (source) this.on(source, 'input', () => {
      if (!this._edited) this.control.commit(slugify(source.value));
    });
  }
}

define('input-slug', InputSlug);

export default InputSlug;
