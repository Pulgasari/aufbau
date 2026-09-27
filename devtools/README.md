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

formerly `@pulgasari/devtools` in js-packages.
