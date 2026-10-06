import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';
import { localeOf }      from '../lib/locale.js';

import { getElement } from '@domina/methods/getElement.js';

const OTHER = '#';

// the initials of the items in target, a button each that scrolls to the first
// item. grouped and sorted by the collation of the element's language, so in
// german Ü goes with U while in swedish Ö is a letter of its own
export default class NavInitials extends AufbauElement {
  static internals = { role: 'navigation' };

  static attr = {
    alphabet : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    empty    : Boolean,
    items    : ':scope > *',
    label    : 'Index',
    order    : { type: String, default: 'asc', values: ['asc', 'desc'] },
    target   : String,
    text     : String,
  };

  static styles = `nav-initials {
    display: block;

    > ol {
      display    : flex;
      flex-wrap  : wrap;
      gap        : 0.25em;
      list-style : none;
      margin     : 0;
      padding    : 0;
    }

    button {
      min-inline-size : 1.75em;
      text-align      : center;

      &:disabled { opacity: 0.35; }
    }
  }`;

  get container () {
    const { target } = this.getAttr();
    return target ? getElement(target) : null;
  }

  onConnected () {
    this.on('click', 'button[data-initial]', (event, button) => {
      const group = this._groups?.get(button.dataset.initial);
      if (!group?.length) return;
      group[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.emit('nav-initials', { initial: button.dataset.initial, items: group });
    });
    this.watch();
  }

  onAttributeChanged (name) {
    if (name === 'target') this.watch();
  }

  watch () {
    this._stopWatching?.();
    this._stopWatching = null;

    const container = this.container;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (this._rescanQueued) return;
      this._rescanQueued = true;
      queueMicrotask(() => { this._rescanQueued = false; this.update(); });
    });
    observer.observe(container, { characterData: true, childList: true, subtree: true });
    this._stopWatching = this.track(() => observer.disconnect());
  }

  // initial -> its items, in the order of the page
  collect () {
    const container = this.container;
    const groups    = new Map;
    if (!container) return groups;

    const { alphabet, items, text } = this.getAttr();
    const collator = new Intl.Collator(localeOf(this), { sensitivity: 'base' });
    const letters  = [...alphabet];

    for (const item of container.querySelectorAll(items)) {
      const source = text ? item.querySelector(text) : item;
      const first  = [...(source?.textContent ?? '').trim()][0]?.toLocaleUpperCase();
      if (!first) continue;

      const initial = /\p{L}/u.test(first)
        ? letters.find(letter => collator.compare(letter, first) === 0) ?? first
        : OTHER;

      if (!groups.has(initial)) groups.set(initial, []);
      groups.get(initial).push(item);
    }

    return groups;
  }

  render () {
    const { alphabet, empty, label, order } = this.getAttr();
    const collator = new Intl.Collator(localeOf(this), { sensitivity: 'base' });

    this._groups = this.collect();

    const initials = new Set(empty ? [...alphabet] : []);
    for (const initial of this._groups.keys()) initials.add(initial);

    const sorted = [...initials].sort((a, b) => a === OTHER ? -1 : b === OTHER ? 1 : collator.compare(a, b));
    if (order === 'desc') sorted.reverse();

    return html`
      <ol aria-label="${label}">
        ${sorted.map(initial => {
          const count = this._groups.get(initial)?.length ?? 0;
          return html`<li><button type="button" ${attrs({ 'data-initial': initial, disabled: !count, title: count })}>${initial}</button></li>`;
        })}
      </ol>
    `;
  }

  sync () {
    if (this.internals) this.internals.ariaLabel = this.getAttr('label');
  }
}

NavInitials.init();
