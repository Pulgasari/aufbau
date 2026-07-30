![Logo](./../logo.svg)

achtung !!! repo und docs sind im aufbau (hehe) und die hier genannten infos sind höchstwahrscheinlich ungenau oder falsch.

[https://pulgasari.github.io/aufbau/docs/](https://pulgasari.github.io/aufbau/docs/)

---

**aufbau** is a browser-focused JS toolkit, library and framework. It's made for being used without any offline build-steps.

***Note:** It's also working with deno, node, vite etc. but working 100% client-side is the main focus.*

#### the kit

[@aufbau/kit](#aufbau-kit)

#### packages

[@aufbau/import](#aufbau-import)
[@aufbau/shaders](#aufbau-shaders)
[@aufbau/stylesheet](#aufbau-stylesheet)

@aufbau/cache
@aufbau/hyperfetch
@aufbau/patterns
@aufbau/shapeshift
@aufbau/templates
@aufbau/themes
@aufbau/workers

#### pure resources

@aufbau/css
@aufbau/svg
@aufbau/webfonts

---

# @aufbau/kit

the **kit** bundles all the following packages with **Preact** and **HTM** to deliver a *batteries-included* JS-framework made in and for the browser.

```javascript
import aufbau, { html } from '@aufbau/kit';
```

***note:** multiple other kits are planned as well.*

---

# packages

## @aufbau/cache

## @aufbau/hyperfetch

## @aufbau/import

It can import the following file formats:

```
csv
json5 jsonc jsx
less
md
sass scss
toml ts tsx tsv
wasm
xml
yaml/yml
```

```javascript
import aufbau from '@aufbau/kit';

const config = await aufbau.import('config.jsonc');
```

## @aufbau/patterns

## @aufbau/shaders

## @aufbau/shapeshift

## @aufbau/stylesheet

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

## @aufbau/templates

## @aufbau/themes

## @aufbau/workers

---

# pure resources

## @aufbau/css

[themes](/css/themes)

## @aufbau/svg

## @aufbau/webfonts

handpicked collection of free webfonts looking great in webdev projects.

---

#

## Import Map

Because **aufbau** ist not published yet one has to define these importmap to use it.

```html
<script type="importmap">{"imports":{
    "htm"                  : "https://esm.sh/htm@3.1.1",
    "preact"               : "https://esm.sh/preact@10.20.1",
    "preact/hooks"         : "https://esm.sh/preact@10.20.1/hooks",
    "@preact/signals"      : "https://esm.sh/@preact/signals@1.2.2?external=preact",
      
    "@aufbau/cache"          : "https://pulgasari.github.io/aufbau/cache/index.js",
    "@aufbau/import"         : "https://pulgasari.github.io/aufbau/import/index.js",
    "@aufbau/kit"            : "https://pulgasari.github.io/aufbau/kit/index.js",
    "@aufbau/patterns"       : "https://pulgasari.github.io/aufbau/patterns/index.js",
    "@aufbau/plugins"        : "https://pulgasari.github.io/aufbau/plugins/index.js",
    "@aufbau/plugins/client" : "https://pulgasari.github.io/aufbau/plugins/client/index.js",
    "@aufbau/plugins/vite"   : "https://pulgasari.github.io/aufbau/plugins/vite/index.js",
    "@aufbau/plugins/worker" : "https://pulgasari.github.io/aufbau/plugins/worker/index.js",
    "@aufbau/shaders"        : "https://pulgasari.github.io/aufbau/shaders/index.js",
    "@aufbau/stylesheet"     : "https://pulgasari.github.io/aufbau/stylesheet/index.js",
    "@aufbau/stylesheet/"    : "https://pulgasari.github.io/aufbau/stylesheet/",
    "@aufbau/utils"          : "https://pulgasari.github.io/aufbau/utils/index.js"
  }}</script>
```
