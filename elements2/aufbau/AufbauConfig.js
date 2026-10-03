import { isPlainObject } from '@pulgasari/is';
import { toJson }        from '@pulgasari/coerce';
import { Logger }        from '@pulgasari/logger';

import { createSource, flatten, removeConfigSource, setConfigSource } from '../lib/config.js';

const log      = new Logger({ prefix: 'aufbau-config' });
const RESERVED = new Set(['id', 'class', 'style', 'hidden', 'is', 'src']);

export default class AufbauConfig extends HTMLElement {
  connectedCallback () {
    this.hidden = true; // never rendered
    this._observer = new MutationObserver(() => this.sync());
    this._observer.observe(this, { attributes: true, characterData: true, childList: true, subtree: true });
    this.sync();
  }

  disconnectedCallback () {
    this._observer?.disconnect();
    removeConfigSource(this);
  }

  sync () {
    const entries = createSource();

    // 1. remote defaults, lowest precedence
    if (this._remote) entries.merge(this._remote);

    const body   = this.textContent.trim();
    const parsed = body ? toJson(body, null) : null;

    if (body && !isPlainObject(parsed)) log.warn('inline body is not a valid json object, ignored.');
    else if (parsed) entries.merge(flatten(parsed));

    // 3. attributes win, most explicit form
    for (const { name, value } of this.attributes) {
      if (RESERVED.has(entries.key(name))) continue;
      entries.set(name, value);
    }

    setConfigSource(this, entries);

    const src = this.getAttribute('src');
    if (src && src !== this._src) this.loadSrc(src);
  }

  async loadSrc (src) {
    this._src = src;
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      this._remote = flatten(await response.json());
      this.sync();
    } catch (error) {
      log.warn(`could not load "${src}":`, error);
    }
  }
}

if (!customElements.get('aufbau-config')) customElements.define('aufbau-config', AufbauConfig);
