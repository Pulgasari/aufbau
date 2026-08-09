![Logo](/logo.svg)

**aufbau** is a browser-focused JS toolkit, library and framework. It's made for being used without any offline build-steps.

***Note:** It's also working with deno, node, vite etc. but working 100% client-side is the main focus.*

#### docs

*read the fucking [docs](https://pulgasari.github.io/aufbau/docs/)! >.<*

#### kits

[@aufbau/kits](#aufbau-kits)

#### packages

[@aufbau/cache](#aufbau-cache)
[@aufbau/elements](#aufbau-elements)
[@aufbau/import](#aufbau-import)
[@aufbau/patterns](#aufbau-patterns)
[@aufbau/plugins](#aufbau-plugins)
[@aufbau/shaders](#aufbau-shaders)
[@aufbau/store](#aufbau-store)
[@aufbau/stylesheet](#aufbau-stylesheet)

#### resources

[@aufbau/css](#aufbau-css)
[@aufbau/svg](#aufbau-svg)
[@aufbau/webfonts](#aufbau-webfonts)

#### web

- [docs](https://pulgasari.github.io/aufbau/docs/)
- [elements](https://pulgasari.github.io/aufbau/elements/)
- [test](https://pulgasari.github.io/aufbau/test/index.html)
- [test/flicker](https://pulgasari.github.io/aufbau/test/flicker.html)

---

# [@aufbau/kits](kits/readme.md)

a **kit** is a *batteries-included* bundle containing all **aufbau**-packages combined with other frameworks/libraries ready to use in the browser.

- preact-htm
- preact-jsx
- react-jsx
- svelte

---

# packages

## [@aufbau/cache](cache/readme.md)

Caching preset over [`@bunker/cache`](https://github.com/pulgasari/bunker), backed by
one IndexedDB database. Holds the content-addressed stylesheet cache, so compiling an
`.ass` file happens once per distinct source rather than on every load.

```javascript
import { compileStylesheet, sheets } from '@aufbau/cache';
import transform from '@aufbau/stylesheet';

const css = await compileStylesheet(source, transform);
```

## [@aufbau/elements](elements/readme.md)

read more [here](elements/readme.md).

## @aufbau/hyperfetch

## [@aufbau/import](cache/readme.md)

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

## [@aufbau/store](store/readme.md)

Persistence preset over [`@bunker/storage`](https://github.com/pulgasari/bunker).
One namespace, one version, and the `persist` attribute contract the elements speak.
Nothing throws: a full quota returns `false`, private mode falls back to memory.

```javascript
import { store } from '@aufbau/store';
store.setSync('theme', 'oled');
```

## [@aufbau/stylesheet](stylesheet/readme.md)

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

---

# pure resources

## [@aufbau/css](/css)

[themes](/css/themes)

## [@aufbau/svg](/svg)

[filters](/svg/filters)
[patterns](/svg/patterns)

## [@aufbau/webfonts](/webfonts)

handpicked collection of free webfonts looking great in webdev projects.
