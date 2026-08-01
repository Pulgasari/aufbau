# @aufbau/elements/core

Lightweight, zero-dependency abstraction layer for Web Components. Provides a unified lifecycle, schema-driven attribute parsing with proxy destructuring, universal event handling with auto-cleanup, and DOM querying helpers.

---

## Architecture

Components are built on top of the `AufbauCore` mixin. It can wrap `HTMLElement` or any native HTML class for customized built-in elements.

```javascript
import { AufbauCore } from './core/AufbauCore.js';

// Base class for standard Web Components
export class AufbauElement extends AufbauCore(HTMLElement) {}

// Base class for customized built-in elements
export class AufbauDatalistElement extends AufbauCore(HTMLDataListElement) {
  static extendsTag = 'datalist';
}
```

---

## Component Lifecycle & Registration

### `static init(options)`
Registers the Custom Element safely with the browser. 
- Auto-derives the kebab-case tag name from the class name (`AufbauAudio` -> `aufbau-audio`).
- Automatically maps `static attr` keys to native `observedAttributes`.
- Prevents duplicate registration errors during Hot Module Replacement (HMR).

```javascript
// Explicit tag or automatic class-name derivation
AufbauAudio.init(); 

// Customized built-in element registration
AufbauDatalist.init({ extends: 'datalist' });
```

### Lifecycle Hooks
Override these methods in subclasses instead of native callbacks.

- `onMount()`: Invoked when element is added to DOM (`connectedCallback`).
- `onUnmount()`: Invoked when element is removed from DOM (`disconnectedCallback`).
- `onAttributeChange(name, oldValue, newValue)`: Invoked when an observed attribute changes.
- `update()`: Triggered automatically on mount, config changes, and attribute updates.

```javascript
export default class MyElement extends AufbauElement {
  onMount() {
    // Setup listeners or initial state
  }

  onUnmount() {
    // Teardown non-event resources
  }

  update() {
    // Render or re-sync UI
  }
}
```

---

## Attribute System (`static attr`, `getAttr`, `setAttr`)

### Schema Tiers (`static attr`)
Attributes can be defined in three levels of specificity.

```javascript
export default class AufbauAudio extends AufbauElement {
  static attr = {
    // 1. Minimal: Constructor function
    src: String,
    
    // 2. Basic: Inferred type & default value
    volume: 50,          // Number, fallback: 50
    autoplay: false,     // Boolean, fallback: false
    
    // 3. Full: Validation enum, explicit fallback, and transformation callback
    layout: {
      type: String,
      default: 'card',
      values: ['card', 'compact', 'full']
    },
    playbackRate: {
      type: Number,
      default: 1.0,
      fn: (val) => Math.max(0.5, Math.min(2.0, val))
    }
  };
}
```

### `getAttr(nameOrType, type, fallback)`
Reads and parses attributes according to the defined schema. Supports Proxy-based destructuring.

```javascript
// 1. Destructure all attributes with automatic type casting & fallbacks
const { src, volume, autoplay, layout } = this.getAttr();

// 2. Query single attribute via schema
const currentVolume = this.getAttr('volume');

// 3. Query single attribute with manual type override
const rawVolumeString = this.getAttr('volume', String);
```

### `setAttr(map)`
Updates DOM attributes. Handles Boolean mapping automatically (`false`/`null` removes attribute, `true` sets empty attribute `""`, primitives convert to String).

```javascript
this.setAttr({
  volume: 80,
  autoplay: true,
  disabled: false // Removes 'disabled' attribute from DOM
});
```

---

## Universal Event System (`on`, `off`, `emit`)

### `on(...args)`
Universal listener supporting self-events, DOM selector delegation, and external targets (e.g. `Audio`, `window`). Returns an unsubscribe function.

```javascript
onMount() {
  // Listen on self
  this.on('click', (e) => this.handleClick(e));

  // Listen on child selector matching
  this.on('.btn-play', 'click', () => this.togglePlay());

  // Listen on external EventTarget
  this.on(window, 'resize', () => this.handleResize());
  this.on(this._audio, 'timeupdate', () => this.syncProgress());
}
```

### `off(type, listener, options)`
Removes event listener from the element.

```javascript
this.off('click', this.handleClick);
```

### `emit(eventName, detail, options)`
Dispatches a custom event configured with `bubbles: true` and `composed: true`.

```javascript
this.emit('aufbau-audio-change', { state: 'playing' });
```

---

## DOM Query Helpers (`$`, `$$`)

### `this.$`
Queries a single element inside Shadow DOM or Light DOM. Supports property access for element IDs.

```javascript
// Selector query
const button = this.$('.btn-play');

// ID lookup via Proxy (looks up #player-container or #playerContainer)
const container = this.$.playerContainer;
```

### `this.$$`
Queries all matching elements and returns them as a standard JavaScript `Array`.

```javascript
const items = this.$$('aufbau-tree-item');
items.forEach(item => item.classList.add('active'));
```

---

## Global Config Store

### `getConfig(attrName, configKey, defaultValue)`
Retrieves configuration following a fallback precedence: Local DOM Attribute -> Global `AufbauConfigStore` -> Default Value.

```javascript
const theme = this.getConfig('theme', 'globalTheme', 'dark');
```

---

## Comparison: Vanilla Web Components vs. Aufbau Core

### Vanilla Web Component (Boilerplate & Manual Work)

```javascript
class VanillaAudio extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'volume', 'autoplay'];
  }

  constructor() {
    super();
    this._onResize = this._onResize.bind(this);
  }

  connectedCallback() {
    window.addEventListener('resize', this._onResize);
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get volume() {
    const val = parseFloat(this.getAttribute('volume'));
    return Number.isNaN(val) ? 50 : val;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  render() {
    const src = this.getAttribute('src') || '';
    const isAutoplay = this.autoplay;
    const vol = this.volume;

    this.innerHTML = `<div class="player">${src} (${vol}%)</div>`;
    
    const btn = this.querySelector('.btn-play');
    if (btn) {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('play-toggle', {
          bubbles: true,
          composed: true,
          detail: { playing: true }
        }));
      });
    }
  }
}

if (!customElements.get('vanilla-audio')) {
  customElements.define('vanilla-audio', VanillaAudio);
}
```

### Aufbau Core Equivalent (Declarative & Clean)

```javascript
import { AufbauElement } from './core/AufbauCore.js';

export default class AufbauAudio extends AufbauElement {
  static attr = {
    src: String,
    volume: 50,
    autoplay: Boolean
  };

  onMount() {
    this.on(window, 'resize', () => this.update());
    this.on('.btn-play', 'click', () => {
      this.emit('play-toggle', { playing: true });
    });
  }

  update() {
    const { src = '', volume, autoplay } = this.getAttr();

    this.innerHTML = `<div class="player">${src} (${volume}%)</div>`;
  }
}

AufbauAudio.init();
```
