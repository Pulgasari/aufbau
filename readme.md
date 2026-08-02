![Logo](logo.svg)

**aufbau** is a browser-focused JS toolkit, library and framework. It's made for being used without any offline build-steps.

***Note:** It's also working with deno, node, vite etc. but working 100% client-side is the main focus.*

#### docs

*read the fucking [docs](https://pulgasari.github.io/aufbau/docs/)! >.<*

#### kits

[@aufbau/kit](#aufbau-kit)

#### packages

[@aufbau/cache](#aufbau-cache)
[@aufbau/elements](#aufbau-elements)
[@aufbau/import](#aufbau-import)
[@aufbau/patterns](#aufbau-patterns)
[@aufbau/plugins](#aufbau-plugins)
[@aufbau/shaders](#aufbau-shaders)
[@aufbau/stylesheet](#aufbau-stylesheet)

@aufbau/hyperfetch
@aufbau/shapeshift
@aufbau/templates
@aufbau/themes
@aufbau/workers

#### resources

[@aufbau/css](#aufbau-css)
[@aufbau/svg](#aufbau-svg)
[@aufbau/webfonts](#aufbau-webfonts)

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

## @aufbau/elements

read more [here](elements/readme.md).

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

das waren bisher die besten

```
abschrift, anschein,
durchblick,
einband, erleuchtung,
geleitwort,
handbuch,
leitbild, leitfaden,
nachweis,
quelltext,
regelwerk,
schimmer, sinnbild, struktur,
überblick, urbild, ursprung,
wegweiser,
zugriff
```

https://skypack.dev
https://svgjs.dev



