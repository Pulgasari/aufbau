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
