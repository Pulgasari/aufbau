class GestaltManager {
  #element;

  constructor (element) {
    this.#element = element;
  }

  // Get raw attribute value
  get (key) {
    return this.#element.getAttribute(`gestalt-${key}`) ?? '';
  }

  // Set attribute value and handle dynamic tokens
  set(key, value) {
    if (value === null || value === undefined || value === '') {
      this.clear(key);
      return;
    }

    const strValue = String(value).trim();

    if (key === 'typo') {
      this.#applyTypo(strValue);
    } else {
      this.#element.setAttribute(`gestalt-${key}`, strValue);
    }
  }

  // Alias for set/update
  replace(key, value) {
    this.set(key, value);
  }

  // Clear attribute and custom CSS properties
  clear(key) {
    this.#element.removeAttribute(`gestalt-${key}`);
    if (key === 'typo') {
      this.#element.style.removeProperty('--gestalt-font-size');
      this.#element.style.removeProperty('--gestalt-line-height');
    }
  }

  // Getter and Setter for shortcut el.gestalt.typo
  get typo() {
    return this.get('typo');
  }

  set typo(value) {
    this.set('typo', value);
  }

  // Parse typo string into dynamic CSS variables and style keywords
  #applyTypo(value) {
    const tokens = value.split(/\s+/).filter(Boolean);
    const keywords = [];

    tokens.forEach((token) => {
      // Matches font sizes and optional line-heights (e.g. 12px, 1.5rem, 16px/1.4)
      const sizeMatch = token.match(/^(\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw))(?:Animation|(?:\/(\d+(?:\.\d+)?(?:px|rem|em|%)?)))?$/);

      if (sizeMatch) {
        const [, size, lineHeight] = sizeMatch;
        this.#element.style.setProperty('--gestalt-font-size', size);
        if (lineHeight) {
          this.#element.style.setProperty('--gestalt-line-height', lineHeight);
        }
      } else {
        keywords.push(token);
      }
    });

    this.#element.setAttribute('gestalt-typo', keywords.join(' '));
  }
}

// Extend Element prototype with 'gestalt' accessor
Object.defineProperty(Element.prototype, 'gestalt', {
  get() {
    if (!this._gestaltManager) {
      this._gestaltManager = new GestaltManager (this);
    }
    return this._gestaltManager;
  },
  configurable: true,
  enumerable: true
});
