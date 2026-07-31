// @aufbau/webcomponents/datalist.js

import importeur from '@aufbau/import';

class AufbauDatalist extends HTMLDataListElement {
  static get observedAttributes() {
    return ['src', 'key', 'label-key'];
  }

  connectedCallback() {
    this.loadData();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.loadData();
    }
  }

  async loadData() {
    const src = this.getAttribute('src');
    const key = this.getAttribute('key') || 'value';
    const labelKey = this.getAttribute('label-key') || 'label';
    if (!src) return;

    try {
      // Use @aufbau/import under the hood (supports .jsonc, .json5, .yaml, .toml, .csv, .xml out-of-the-box!)
      const data = await importeur(src);
      
      // Normalize imported data into an array
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object') {
        // Fallback for wrapped payloads like { items: [...] } or { data: [...] }
        items = data.items || data.data || data.results || Object.values(data);
      }

      // Render options
      this.innerHTML = items.map(item => {
        if (typeof item === 'object' && item !== null) {
          const val = item[key] ?? item.value ?? Object.values(item)[0];
          const label = item[labelKey] ? ` label="${item[labelKey]}"` : '';
          return `<option value="${val}"${label}></option>`;
        }
        return `<option value="${item}"></option>`;
      }).join('');

    } catch (err) {
      console.warn(`[aufbau-datalist] Could not import data from "${src}":`, err);
    }
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-datalist')) {
  customElements.define('aufbau-datalist', AufbauDatalist, { extends: 'datalist' });
}
