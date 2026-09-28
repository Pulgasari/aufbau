# @aufbau/devtools

in-page devtools for the browsers and webviews that have none of their own at
hand, a phone above all. a bar with panels, docked at the bottom or the top of
the page, resizable, its settings remembered.

| panel      | shows |
|------------|-------|
| console    | the page's console, filterable, entries to copy, delete or re-run |
| dom        | the element tree, pick an element on the page |
| css        | the stylesheets, and a live stylesheet of your own |
| data       | localStorage, sessionStorage, cookies and more |
| files      | the origin private file system (opfs) |
| settings   | position, height and the options of each panel |

## usage

`boot.js` sets everything up when it is imported, so it is loaded on demand,
e.g. only with `?dev` in the url:

```javascript
if (new URLSearchParams(location.search).has('dev')) await import('@aufbau/devtools/boot.js');
```

it uses `@aufbau/elements`, `@domina/methods` and `@htx/js` from the import map.

## recorder

the console panel mounts late, after boot and the app have already logged.
`recorder.js` is a classic script for `<head>` that records console calls, failed
loads, unhandled rejections and csp violations from the start into a ring buffer
(`globalThis.__DEVTOOLS_RECORDER__`, 500 entries), which the panel drains when it
opens. load it unconditionally, before anything else, not behind `?dev`: turning
devtools on with a reload would lose the error you wanted to see.

```html
<script src="https://code.pulgasari.dev/aufbau/devtools/recorder.js"></script>
```

formerly `@pulgasari/devtools` in js-packages.
