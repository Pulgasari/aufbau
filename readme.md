![Logo](logo.svg)

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

## @aufbau/templates

## @aufbau/themes

## @aufbau/workers

---

# pure resources

## @aufbau/css

## @aufbau/svg

## @aufbau/webfonts

handpicked collection of free webfonts looking great in webdev projects.

