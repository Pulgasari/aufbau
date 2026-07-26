# @aufbau/stylesheet

Aufbau Stylesheets are an enhancement of CSS.

## overview

```css
aufbau-flex
aufbau-grid
aufbau-webfont

@aufbau <property>
@aufbau colors
```

---

[aufbau-props](#aufbau-props) —
[@aufbau](#aufbau) —
[usage](#usage)

---

# aufbau-props

ASS provides several additional properties mostly for nice shorthands.

## aufbau-colors

shorthand for `background-color` and `color`.

```css
div { aufbau-colors: black white; }
```

advanced usage:

```css
@aufbau colors {
  oled  : black white;
  light : #D5D5D5 #222222;
}

button       { aufbau-colors: oled;          }
button:hover { aufbau-colors: oled inverted; }
```

## aufbau-flex

## aufbau-grid

## aufbau-webfont

Use a Google Webfont with ease.

It adds the `@import`-statement to the CSS file.

```css
body {
  aufbau-webfont: "JetBrains Mono";
}
```

---

# @aufbau

## default values

```css
@aufbau gap {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}
```

---

# usage

## usage in browser worker

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { initBrowser } from './node_modules/@aufbau/stylesheet/src/index.js';
    initBrowser({ useWorker: true, workerPath: '/sw.js' });
  </script>

  <style type="text/aufbau">
    @aufbau gap {
      small : 0.5rem;
      big   : 2.0rem;
    }

    body {
      aufbau-webfont : "JetBrains Mono";
      aufbau-flex    : column center gap(big);
    }
  </style>

  <link rel="stylesheet" href="/styles/main.aufbau.css">
</head>
<body>
  <h1>Aufbau CSS läuft!</h1>
</body>
</html>
```

## usage with vite

```javascript
import { defineConfig } from 'vite';
import aufbauStylesheet from '@aufbau/stylesheet/vite';

export default defineConfig({
  plugins: [
    aufbauStylesheet()
  ]
});
```

