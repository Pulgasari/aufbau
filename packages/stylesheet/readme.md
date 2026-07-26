# @aufbau/stylesheet

Aufbau Stylesheets are an enhancement of CSS.

## overview

```css
aufbau-flex
aufbau-grid
aufbau-webfont
```

## aufbau-webfont

Use a Google Webfont with ease.

It adds the `@import`-statement to the CSS file.

```css
body {
  aufbau-webfont: "JetBrains Mono";
}
```

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

## use worker

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
