// <aufbau-table>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import { sortElements } from '@domina/methods/sortElements.js';
import { html }      from './core/html.js';
import { arrayfied } from './core/utils.js';
import { isArray }   from '@pulgasari/is';

export default class AufbauTable extends AufbauElement {
  static attr = {
    src      : String,
    columns  : String,
    sortable : Boolean,
  };

  // allow setting data directly: table.data = [{ id: 1, name: 'Alpha' }]
  set data (value) { this._data = value; this._loadedSrc = null; this.invalidate().update(); }
  get data ()      { return this._data; }

  onMount () {
    this.on('click', 'th[data-key]', (e, th) => {
      if (!this.getAttr('sortable')) return;
      this.sortBy(th.dataset.key);
    });
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
      try {
        this._data = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-table] could not load table data from "${src}":`, err);
        this._error = 'Failed to load table data.';
      }
    }

    super.update();
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
    if (this._error) return html`<div class="aufbau-table-error">${this._error}</div>`;
    if (!this._data) return html`<div class="aufbau-table-empty">No data available</div>`;

    const rows = this.rows;
    const keys = this.keys;

    if (!rows.length) {
      return html`<table class="aufbau-table"><tbody><tr><td>No entries</td></tr></tbody></table>`;
    }

    return html`
      <div class="aufbau-table-wrapper">
        <table class="aufbau-table">
          <thead>
            <tr>${keys.map(key => html`<th data-key="${key}">${key}</th>`)}</tr>
          </thead>
          <tbody>
            ${rows.map(row => typeof row === 'object' && row !== null
              ? html`<tr>${keys.map(k => html`<td data-key="${k}">${row[k] ?? ''}</td>`)}</tr>`
              : html`<tr><td>${row}</td></tr>`)}
          </tbody>
        </table>
      </div>
    `;
  }

  sync () {
    const sortable = this.getAttr('sortable');

    for (const th of this.$$('th[data-key]')) {
      th.classList.toggle('is-sortable', sortable);
      const active = sortable && th.dataset.key === this._sortKey;
      th.setAttribute('aria-sort', active ? (this._sortDir === 'desc' ? 'descending' : 'ascending') : 'none');
    }
  }
}

AufbauTable.init();
