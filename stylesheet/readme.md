# @aufbau/stylesheet

Aufbau Stylesheets are an enhancement of CSS.

## overview

```css
aufbau-center
aufbau-colors
aufbau-dirty
aufbau-flex
aufbau-grid
aufbau-icon
aufbau-pattern
aufbau-unset
aufbau-use
aufbau-webfont

@aufbau <property>
@aufbau colors

@aufbau-config
@aufbau-media
@aufbau-trait
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

shade engine:

```css
@aufbau color {
  brand : #5865f2;
}

.card {
  background   : brand-a20;
  border-color : brand-d15;
}
```

## aufbau-dirty

## aufbau-flex

## aufbau-grid

## aufbau-icon

```css
.search-btn {
  aufbau-icon : 'bx:search' size(1.5rem) color(brand-d30);
}

.close-btn {
  aufbau-icon : 'lucide:x';
}
```

## aufbau-pattern

## aufbau-unset

unset multiple properties at once.

```css
.clean-button {
  aufbau-unset: margin padding border background color;
}
```

## aufbau-use

Look at: [@aufbau-trait](#aufbau-trait)

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

@aufbau-media breakpoints {
  mobile  : 480px;
  tablet  : 768px;
  desktop : 1024px;
}
```

## @aufbau-config

```css
@aufbau-config {
  charset : utf-8;
  font    : 'Hubot Sans';
  import  : reset, default;
  themes  : monochrome, oled, zombie;
}
```

```css
@aufbau-config {
  charset : utf-8;
  font    : {
    body       : 'Hubot Sans';
    textarea   : 'JetBrains Mono';
    blockquote : 'Vollkorn';
  };
  import  : reset, default;
  theme   : oled;
  themes  : monochrome, oled, zombie;
}
```

## @aufbau-media

```css
@aufbau-media breakpoints {
  mobile  : 480px;
  tablet  : 768px;
  desktop : 1024px;
}

.card {
  aufbau-flex : column;
  box-shadow  : md;

  @media-media (>= tablet) {
    aufbau-flex : row;
    box-shadow  : lg;
  }
}
```

## @aufbaut-trait

```css
@aufbaut-trait .vert { 
  display   : flex; 
  flex-flow : column;

  > * { flex: 1 0 auto; }
}

body { aufbau-use: .vert; }
#app { aufbau-use: .vert; }
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

---

#

# rendering without a flash

Aufbau stylesheets are compiled in the browser, which means there is a window in
which a page can be shown before its real styles are ready. Two paths close it, and
they cover different gaps.

## 1. service worker

The strongest fix. A service worker answers the browser's own request for the
stylesheet, so the `<link>` stays an ordinary render-blocking link and resolves from
cache. No JavaScript on the critical path, and the compile is paid once instead of on
every navigation.

```javascript
import aufbau from '@aufbau/kits';
self.addEventListener('fetch', (event) => {
  event.respondWith(aufbau.interceptFetch(event).then(response => response ?? fetch(event.request)));
});
```

It covers fonts too — serving the `woff2` from cache leaves the browser's font
pipeline untouched, so `font-display` and `unicode-range` keep working.

It does *not* cover the very first visit (the worker has to install first), and it
needs HTTPS or localhost.

## 2. boot script

Covers exactly that gap, and any browser without a worker.

```html
<head>
  <script src="https://code.pulgasari.dev/aufbau/boot.js"></script>
  <link rel="stylesheet" href="./app.ass">
</head>
```

It must come **first**, and it must stay a plain classic script — not `type=module`,
not `defer`, not `async`. All three postpone execution past the parser, which is
precisely the window being closed.

`localStorage` is the only web storage API that can be read synchronously, which
makes it the only one able to put styles on the page before the first paint. The
script reads the CSS the previous visit compiled, injects it, and then neutralises
the `<link>` it just pre-empted — otherwise that link would block rendering anyway
and then overwrite the compiled rules with raw `.ass`.

A changed stylesheet is written on revalidation but applied on the **next** load. A
late swap reflows a page the reader is already looking at, which is usually worse
than the wait it saves. `configure({ swap: 'immediate' })` on
`@aufbau/plugins/client` opts into swapping in place.

## 3. the loading screen

The two paths above close the window in which a page is shown *unstyled*. They do
nothing about the one in which it is shown *empty* — the module graph still has to
arrive, and without a bundler that is by far the longest wait on the page.

`<aufbau-splash>` covers that one. It is the same trick one layer up: a blocking
classic script puts the overlay on the page before anything else can, and the
component only decides when it goes away.

```html
<script src="https://code.pulgasari.dev/aufbau/boot.js" data-splash></script>
...
<aufbau-splash role="status" aria-live="polite">lädt…</aufbau-splash>
```

It reveals after a short delay, so a boot that beats the delay never shows it at
all, and it clears itself from pure CSS if the module graph never lands. See
[`@aufbau/elements`](../elements/readme.md#aufbau-splash).

## fonts

Storage is only half of it. The rest is CSS: `font-display: optional` avoids the swap
flash outright, `<link rel=preload as=font crossorigin>` starts the download earlier,
and `size-adjust` / `ascent-override` on the fallback face stop the metric jump when
the real font arrives.

---

**Aufbau Stylesheets** (`.ass` or `.aufbau.css`)

```
deno install jsr:@aufbau/stylesheet
```

it provides a bunch of pseudo-css-properties and mechanisms to handle css files better. (it's not really like scss.)

```css
/* aufbau-webfont :: use a google webfont */
body { aufbau-webfont: "JetBrains Mono"; }

/* aufbau-icon :: use any icon provided by iconify */
.close-btn  { aufbau-icon: 'lucide:x'; }
.search-btn { aufbau-icon: 'bx:search' size(24px) color(#008800); }
```

```css
/* @aufbau :: define and use value aliases */

/* works for any css property */
/* these become also available on 'padding-left' etc. */
@aufbau gap, margin, padding {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}
body     { gap: normal; padding: normal; }
body > * { padding: small; }

/* become available on background-color, color, fill etc. */
@aufbau color {
  almostblack : #000001;
  brand       : #5865f2;
}
.card { background: almostblack; color: brand; }
.card {
  background-color : brand-a20; /* +20% transparency */
  border-color     : brand-d15; /* +15% black */
  color            : brand-l10; /* +10% white */
}
```
