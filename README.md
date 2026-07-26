![Logo](logo.svg)

# aufbau

**aufbau** is build  for in-browser vanilla JS.

[@aufbau/kit](#aufbau-kit)

[@aufbau/import](#aufbau-import)
[@aufbau/shaders](#aufbau-shaders)
[@aufbau/stylesheet](#aufbau-stylesheet)

---

# @aufbau/kit

the **kit** bundles all the following packages with **Preact** and **HTM** to deliver a *batteries-included* JS-framework made in and for the browser.

```javascript
import aufbau, { html } from '@aufbau/kit';
```

---

# packages

## aufbau-import

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

## aufbau stylesheets

```
deno install jsr:@aufbau/stylesheet
```

## aufbau shaders

## aufbau css utils
