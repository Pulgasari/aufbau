// <input-url>
// a url. an address typed without a scheme gets https:// once the field is
// left: 'example.com' -> 'https://example.com'.
//
//   <input-url name="site"></input-url>

import { InputComponent } from '../core/InputComponent.js';
import { define }         from '../core/names.js';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** the url with https:// in front where it has no scheme */
export const normalizeUrl = value => {
  const url = String(value ?? '').trim();
  return !url || SCHEME.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
};

export class InputUrl extends InputComponent {

  static type = 'url';

  bind () {
    this.on(this.control, 'change', event => {
      if (event.target !== this.control) return;
      const url = normalizeUrl(this.value);
      if (url !== this.value) this.control.commit(url);
    });
  }
}

define('input-url', InputUrl);

export default InputUrl;
