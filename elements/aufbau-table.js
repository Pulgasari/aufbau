import { AufbauElement } from './AufbauElement.js';
import aufbau from '@aufbau/kit';

export class AufbauTable extends AufbauElement {
  static get observedAttributes() {
    return ['src', 'columns'];
  }

  // Allow setting data directly via JavaScript: $table.data = [{ id: 1, name: 'Alpha' }]
  set data(value) {
    this._data = value;
    this.update();
  }

  get data() {
    return this._data;
  }

  async update() {
    const src = this.getAttribute('src');

    // 1. Fetch remote data via @aufbau/import if src attribute is present
    if (src) {
      try {
        this._data = await aufbau.import(src);
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

  renderTable(rawContainer) {
    // Normalize input data into an array of objects
    let rows = Array.isArray(rawContainer) ? rawContainer : [rawContainer];
    
    // Handle wrapped payloads like { data: [...] }
    if (rows.length === 1 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
      const firstVal = Object.values(rows[0])[0];
      if (Array.isArray(firstVal)) rows = firstVal;
    }

    if (!rows.length) {
      this.innerHTML = `<table class="aufbau-table"><tbody><tr><td>No entries</td></tr></tbody></table>`;
      return;
    }

    // Determine column keys (explicit attribute vs. auto-detected from first object)
    const explicitCols = this.getAttribute('columns')
      ? this.getAttribute('columns').split(',').map(c => c.trim())
      : null;

    const sampleRow = rows[0];
    const keys = explicitCols || (typeof sampleRow === 'object' && sampleRow !== null ? Object.keys(sampleRow) : ['Value']);

    // Build Table Header
    const thead = `
      <thead>
        <tr>
          ${keys.map(key => `<th>${key}</th>`).join('')}
        </tr>
      </thead>
    `;

    // Build Table Body
    const tbody = `
      <tbody>
        ${rows.map(row => {
          if (typeof row !== 'object' || row === null) {
            return `<tr><td>${row}</td></tr>`;
          }
          const cells = keys.map(k => `<td>${row[k] ?? ''}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('')}
      </tbody>
    `;

    this.innerHTML = `
      <div class="aufbau-table-wrapper">
        <table class="aufbau-table">
          ${thead}
          ${tbody}
        </table>
      </div>
    `;
  }
}

customElements.define('aufbau-table', AufbauTable);
