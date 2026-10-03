// <aufbau-table>

// the host is the scroll container, the <table> its only child. sortable
// headers carry a <button> so sorting works from the keyboard, the direction
// is announced through aria-sort.

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import { sortElements }  from '@domina/methods/sortElements.js';
import { html }          from './core/html.js';
import { arrayfied }     from './core/utils.js';
import { isArray }       from '@pulgasari/is';

export default class AufbauTable extends AufbauElement {
  static skeleton = { lines: 5, line: '1.5em', width: '100%' };

  static attr = {
    columns  : String,
    sortable : Boolean,
    src      : String,
  };

  static styles = `aufbau-table {
    display    : block;
    overflow-x : auto;

    > table { border-collapse: collapse; inline-size: 100%; }

    th > button {
      background  : none;
      border      : 0;
      color       : inherit;
      cursor      : pointer;
      font        : inherit;
      inline-size : 100%;
      margin      : 0;
      padding     : 0;
      text-align  : inherit;
    }
  }`;

  // allow setting data directly: table.data = [{ id: 1, name: 'Alpha' }]
  set data (value) { this._data = value; this._loadedSrc = null; this.invalidate().update(); }
  get data ()      { return this._data; }

  onMount () {
    this.on('click', 'th[data-key] > button', (event, button) => this.sortBy(button.parentElement.dataset.key));
  }

  sortBy (key) {
    const desc = this._sortKey === key && this._sortDir !== 'desc';
    this._sortKey = key;
    this._sortDir = desc ? 'desc' : 'asc';

    sortElements({
      container  : this.$('tbody'),
      item       : 'tr',
      indicators : [[`[data-key="${key}"]`, `auto-${this._sortDir}`]]
    });

    this.sync();
    this.emit('aufbau-table-sort', { key, direction: this._sortDir });
  }

  async update () {
    const { src } = this.getAttr();

    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      this.setSkeleton(true);
      try {
        this._data = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-table] could not load table data from "${src}":`, err);
        this._error = 'Failed to load table data.';
      }
      this.setSkeleton(false);
    }

    return super.update();
  }

  /** unwraps payloads like { data: [...] } and normalizes to a row array */
  get rows () {
    let rows = arrayfied(this._data);

    if (rows.length === 1 && typeof rows[0] === 'object' && !isArray(rows[0])) {
      const first = Object.values(rows[0])[0];
      if (isArray(first)) rows = first;
    }
    return rows;
  }

  get keys () {
    const { columns } = this.getAttr();
    if (columns) return columns.split(',').map(c => c.trim());

    const sample = this.rows[0];
    return typeof sample === 'object' && sample !== null ? Object.keys(sample) : ['Value'];
  }

  render () {
    if (this._error) return html`<p role="alert">${this._error}</p>`;
    if (!this._data) return html`<p role="status">No data available</p>`;

    const rows     = this.rows;
    const keys     = this.keys;
    const sortable = this.getAttr('sortable');

    if (!rows.length) return html`<p role="status">No entries</p>`;

    const head = key => sortable ? html`<button type="button">${key}</button>` : key;

    return html`
      <table>
        <thead>
          <tr>${keys.map(key => html`<th scope="col" data-key="${key}">${head(key)}</th>`)}</tr>
        </thead>
        <tbody>
          ${rows.map(row => typeof row === 'object' && row !== null
            ? html`<tr>${keys.map(key => html`<td data-key="${key}">${row[key] ?? ''}</td>`)}</tr>`
            : html`<tr><td>${row}</td></tr>`)}
        </tbody>
      </table>
    `;
  }

  sync () {
    const sortable = this.getAttr('sortable');

    for (const th of this.$$('th[data-key]')) {
      const active = sortable && th.dataset.key === this._sortKey;
      if (sortable) th.setAttribute('aria-sort', active ? (this._sortDir === 'desc' ? 'descending' : 'ascending') : 'none');
      else th.removeAttribute('aria-sort');
    }
  }
}

AufbauTable.init();
