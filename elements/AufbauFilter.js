// <aufbau-filter>

import AufbauElement from './AufbauElement.js';

export default class AufbauFilter extends AufbauElement {
  static attr = {
    placeholder : 'Filter...',
    target      : String,
    debounce    : 100
  };

  onMount () {
    let timer = null;

    this.on('aufbau-input', (e) => {
      const { debounce: delay } = this.getAttr();
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.applyFilter(e.detail.value);
      }, delay);
    });
  }

  applyFilter (query) {
    const { target: targetQuery } = this.getAttr();
    if (!targetQuery) return;

    const items = document.querySelectorAll(targetQuery);
    const normalizedQuery = query.toLowerCase().trim();

    items.forEach(item => {
      const text = item.textContent || '';
      const isMatch = text.toLowerCase().includes(normalizedQuery);
      item.hidden = !isMatch;
    });
  }

  update () {
    const { placeholder } = this.getAttr();

    this.innerHTML = `
      <aufbau-input 
        type="search" 
        placeholder="${placeholder}"
      ></aufbau-input>
    `;
  }
}

AufbauFilter.init();
