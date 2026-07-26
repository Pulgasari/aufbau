# @aufbau/kit

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="importmap">
    {
      "imports": {
        "@aufbau/kit": "./packages/kit/index.js",
        "preact": "https://esm.sh/preact@10.22.0",
        "preact/hooks": "https://esm.sh/preact@10.22.0/hooks",
        "@preact/signals": "https://esm.sh/@preact/signals@1.3.0",
        "htm": "https://esm.sh/htm@3.1.1"
      }
    }
  </script>
</head>
<body>
  <script type="module">
    import { html, signal, createApp } from '@aufbau/kit';

    const count = signal(0);

    function App() {
      return html`
        <div class="layout:center flex:col gap:16">
          <h1 class="color:#333">Aufbau App</h1>
          <button 
            class="shader:glitch hover:scale:105" 
            onClick=${() => count.value++}
          >
            Clicks: ${count}
          </button>
        </div>
      `;
    }

    createApp(html`<${App} />`);
  </script>
</body>
</html>
```

##

### Option A: Namespace 

```javascript
import aufbau from '@aufbau/kit';

aufbau.config({ autoClient: true });
const count = aufbau.signal(0);
```

## Option B: Destructuring from `aufbau` Singleton

```javascript
import { aufbau } from '@aufbau/kit';

const { signal, html, effect, config, cache, import: importFile, createApp } = aufbau;

// Config setzen
config({
  imports: { "three": "https://esm.sh/three" }
});

const count = signal(0);
```

### Option C: Direct Named Imports

```javascript
import { signal, html, config, createApp } from '@aufbau/kit';

config({ autoClient: true });
const count = signal(0);
```




