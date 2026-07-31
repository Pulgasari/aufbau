// @aufbau/webcomponents/filter.js

class AufbauFilter extends HTMLElement {
  static get observedAttributes() {
    return ['target', 'debounce'];
  }

  connectedCallback() {
    this.innerHTML = `
      <aufbau-input 
        type="search" 
        placeholder="${this.getAttribute('placeholder') || 'Filter...'}"
      ></aufbau-input>
    `;

    let timer = null;
    this.addEventListener('aufbau-input', (e) => {
      const delay = parseInt(this.getAttribute('debounce') || '100', 10);
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.applyFilter(e.detail.value);
      }, delay);
    });
  }

  applyFilter(query) {
    const targetQuery = this.getAttribute('target');
    if (!targetQuery) return;

    const items = document.querySelectorAll(targetQuery);
    const normalizedQuery = query.toLowerCase().trim();

    items.forEach(item => {
      const text = item.textContent || '';
      const isMatch = text.toLowerCase().includes(normalizedQuery);
      
      // Toggle hidden state natively
      item.hidden = !isMatch;
    });
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-filter')) {
  customElements.define('aufbau-filter', AufbauFilter);
}
