# @aufbau/devtools

in-page devtools for the browsers and webviews that have none of their own at
hand, a phone above all. a bar with panels, docked at the bottom or the top of
the page, resizable, its settings remembered.

every panel is an element of its own, `<dev-tools>` puts them together.

| element          | shows |
|------------------|-------|
| `<dev-console>`  | the page's console, filterable, entries to copy, delete or re-run |
| `<dev-dom>`      | the element tree, pick an element on the page |
| `<dev-css>`      | the stylesheets, and a live stylesheet of your own |
| `<dev-data>`     | localStorage, sessionStorage, cookies and more |
| `<dev-files>`    | the origin private file system (opfs) |
| `<dev-settings>` | position, height and the options of each panel |
| `<dev-style>`    | a placeholder |

## usage

`boot.js` sets everything up when it is imported, so it is loaded on demand,
e.g. only with `?dev` in the url:

```javascript
if (new URLSearchParams(location.search).has('dev')) await import('@aufbau/devtools/boot.js');
```

it uses `@aufbau/element`, `@aufbau/elements`, `@domina/methods` and `@htx/js`
from the import map.

## elements

```javascript
import '@aufbau/devtools';   // defines the elements, puts nothing on the page
```

```html
<dev-tools></dev-tools>                          <!-- all panels, what boot.js adds -->
<dev-tools panels="console data"></dev-tools>    <!-- some of them -->
<dev-files></dev-files>                          <!-- one panel, anywhere -->
```

a panel is a `DevPanel` (`panels/DevPanel.js`) around its factory, which still
returns `{ $content, onShow?, onHide? }`. it is shown while it is connected and
not `hidden`, so a panel polls only while it is on screen. `<dev-tools>` opens
one at a time by toggling `hidden`, `toggle(key, force)` does the same from
outside. a panel of your own is a subclass with `static create` and
`static icon`, its tag `dev-<key>` goes into `panels`.

`devtools.css` still speaks of `#devtools` and `#devtools-<key>`, so a panel
outside of `<dev-tools>` works but is unstyled for now.

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
