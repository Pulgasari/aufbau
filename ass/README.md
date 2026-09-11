# @aufbau/ass (Aufbau Style Sheets)

**Aufbau Style Sheets (ASS)** is a superset of CSS. It basically adds a little bit of sugar and integration of aufbau-packages related to the appearance of a website/webapp.

## overview


---

# philosophy

## we do love css, but ...

... when working with it, it soons becomes kinda redundant and messy.

## the 3-way-relationship

every rule is in the end a 3 way relationship: 
element/scope/target -> property -> value

```css
div { color: red; }
```

---

# additional at-rules

[@default](#)
[@mixin](#)
[@prop](#)
[@value](#)

## `@default`

(or maybe: `@def` `@define` `@preset`)

```css
/* :::::::::: DEFINE :::::::::: */
/* these become also available on 'padding-left' etc. */

@default gap, margin, padding {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}

@default color {
  brand: #008800;
}

/* :::::::::: USAGE :::::::::: */

.example {
  color: brand;
  gap: small;
}
```

```css
.example {
  color : #008800;
  gap   : 0.50rem;
}
```

## `@mixin`

```css
@mixin vert { 
  display   : flex; 
  flex-flow : column;

  > * { flex: 1 0 auto; }
}

body { use: .vert; }
#app { use: .vert; }
```

however any class-block could be used as a mixin as well:

```css
.vert { 
  display   : flex; 
  flex-flow : column;

  > * { flex: 1 0 auto; }
}

body { use: .vert; }
#app { use: .vert; }
```

## `@prop` and `@value`

because we are inside a selector 

the `@value` prefix tells the engine that the left side is a value which should be applied to the props on the rights side.

```css
.clean-button {
  @value #FFFF00 : background-color;
  @value red     : border-color color;
  @value unset   : margin padding;
}
```

```css
.clean-button {
  background-color : #FFFF00;
  border-color     : red;
  color            : red;
  margin           : unset;
  padding          : unset;
}
```

now let's have a look on `@prop`:

```css
@prop font-size {
  header : 20px;
  main   : 16px;
  footer : 12px;
}
```

---

# aufbau-props

ASS provides several additional properties with an `aufbau-` prefix to make use of several aufbau packages.

[aufbau-filter](#aufbau-filter)
[aufbau-icon](#aufbau-icon)
[aufbau-pattern](#aufbau-pattern)
[aufbau-webfont](#aufbau-webfont)

## aufbau-filter

```css
div {
  aufbau-filter: glitch;
}
```

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

```css
div {
  aufbau-pattern: grid;
}
```

## aufbau-webfont

```css
body {
  aufbau-webfont: "JetBrains Mono";
}
```

---






```css
@a11y
```





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

---

# @aufbau



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



---

# usage

## usage in browser worker

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { assWorker } from '@aufbau/ass/worker';
    // ...
  </script>

  <style type="text/aufbau">
    @default gap {
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

## fonts

Storage is only half of it. The rest is CSS: `font-display: optional` avoids the swap flash outright, `<link rel=preload as=font crossorigin>` starts the download earlier, and `size-adjust` / `ascent-override` on the fallback face stop the metric jump when the real font arrives.

---

# install

## esm / browser

### classic script

```javascript
import 'https://esm.sh/jsr/@aufbau/ass/run.js';
```

deno
```
deno install jsr:@aufbau/ass
```


