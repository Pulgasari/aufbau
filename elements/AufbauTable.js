// <aufbau-table>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';

export default class AufbauTable extends AufbauElement {
  static attr = ['src', 'columns'];

  // allow setting data directly: table.data = [{ id: 1, name: 'Alpha' }]
  set data (value) { this._data = value; this.update(); }
  get data ()      { return this._data; }

  async update () {
    const src = this.getAttr('src');

    if (src) {
      try {
        this._data = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-table] Error loading table data from "${src}":`, err);
        this.innerHTML = `<div class="aufbau-table-error">Failed to load table data.</div>`;
        return;
      }
    }

    if (!this._data) {
      this.innerHTML = `<div class="aufbau-table-empty">No data available</div>`;
      return;
    }

    this.renderTable(this._data);
  }

  renderTable (raw) {
    let rows = Array.isArray(raw) ? raw : [raw];

    // unwrap payloads like { data: [...] }
    if (rows.length === 1 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
      const firstVal = Object.values(rows[0])[0];
      if (Array.isArray(firstVal)) rows = firstVal;
    }

    if (!rows.length) {
      this.innerHTML = `<table class="aufbau-table"><tbody><tr><td>No entries</td></tr></tbody></table>`;
      return;
    }

    const columns = this.getAttr('columns');
    const sample  = rows[0];

    const keys = columns
      ? columns.split(',').map(c => c.trim())
      : (typeof sample === 'object' && sample !== null ? Object.keys(sample) : ['Value']);

    this.innerHTML = `
      <div class="aufbau-table-wrapper">
        <table class="aufbau-table">
          <thead>
            <tr>${keys.map(key => `<th>${key}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => typeof row === 'object' && row !== null
              ? `<tr>${keys.map(k => `<td>${row[k] ?? ''}</td>`).join('')}</tr>`
              : `<tr><td>${row}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

AufbauTable.init();
