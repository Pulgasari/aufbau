import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

import { getElement } from '@domina/methods/getElement.js';

const GAP = '…';

// pages of the items in target: the items off the page get hidden. without a
// target it only shows `pages` and tells which one was picked
export default class NavPaginate extends AufbauElement {
  static internals = { role: 'navigation' };

  static attr = {
    around : 1,
    items  : ':scope > *',
    label  : 'Pagination',
    page   : 1,
    pages  : 1,
    size   : 10,
    target : String,
  };

  static styles = `nav-paginate {
    display: block;

    > ol {
      align-items : center;
      display     : flex;
      flex-wrap   : wrap;
      gap         : --space(tiny);
      list-style  : none;
      margin      : 0;
      padding     : 0;
    }

    button {
      min-inline-size : 2em;
      text-align      : center;

      &[aria-current="page"] { font-weight: 700; }
    }
  }`;

  hidden = new Set;

  get container () {
    const { target } = this.getAttr();
    return target ? getElement(target) : null;
  }

  get list () {
    const container = this.container;
    return container ? [...container.querySelectorAll(this.getAttr('items'))] : null;
  }

  get count () {
    const list = this.list;
    return list ? Math.max(1, Math.ceil(list.length / Math.max(1, this.getAttr('size')))) : Math.max(1, this.getAttr('pages'));
  }

  get current () {
    return Math.min(this.count, Math.max(1, Math.round(this.getAttr('page'))));
  }

  onConnected () {
    this.on('click', 'button[data-page]', (event, button) => this.go(Number(button.dataset.page)));
    this.watch();
    this.track(() => this.reveal());
  }

  onAttributeChanged (name) {
    if (name === 'target') { this.reveal(); this.watch(); }
  }

  go (page) {
    const next = Math.min(this.count, Math.max(1, page));
    if (next === this.current) return;
    this.setAttribute('page', next);
    this.emit('nav-paginate', { page: next, pages: this.count });
  }

  watch () {
    this._stopWatching?.();
    this._stopWatching = null;

    const container = this.container;
    if (!container) return;

    const observer = new MutationObserver(() => this.update());
    observer.observe(container, { childList: true });
    this._stopWatching = this.track(() => observer.disconnect());
  }

  // 1 … 4 5 6 … 12
  numbers () {
    const { around } = this.getAttr();
    const count   = this.count;
    const current = this.current;
    const shown   = [];

    for (let page = 1; page <= count; page++) {
      const near = Math.abs(page - current) <= around;
      if (page === 1 || page === count || near) shown.push(page);
      else if (shown.at(-1) !== GAP) shown.push(GAP);
    }

    return shown;
  }

  render () {
    const current = this.current;
    const count   = this.count;

    return html`
      <ol>
        <li><button type="button" aria-label="previous page" ${attrs({ 'data-page': current - 1, disabled: current <= 1 })}>‹</button></li>
        ${this.numbers().map(page => page === GAP
          ? html`<li aria-hidden="true">${GAP}</li>`
          : html`<li><button type="button" ${attrs({ 'aria-current': page === current && 'page', 'data-page': page })}>${page}</button></li>`)}
        <li><button type="button" aria-label="next page" ${attrs({ 'data-page': current + 1, disabled: current >= count })}>›</button></li>
      </ol>
    `;
  }

  sync () {
    if (this.internals) this.internals.ariaLabel = this.getAttr('label');

    const list = this.list;
    if (!list) return;

    const size  = Math.max(1, this.getAttr('size'));
    const start = (this.current - 1) * size;

    list.forEach((item, index) => {
      const off = index < start || index >= start + size;
      item.hidden = off;
      if (off) this.hidden.add(item);
      else     this.hidden.delete(item);
    });
  }

  // what this element hid is shown again
  reveal () {
    for (const item of this.hidden) item.hidden = false;
    this.hidden.clear();
  }
}

NavPaginate.init();
