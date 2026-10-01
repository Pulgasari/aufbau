# @aufbau/components

ready to use components, composed of `@aufbau/elements`. the elements are the
primitives (a picker, a writer, an input), the components bring the domain: a
data source, a fixed value format, the language they are shown in.

```html
<input-language name="lang" value="de"></input-language>
<input-icon name="icon" value="lucide:star" prefixes="lucide bx"></input-icon>
<write-md name="notes" preview="side"></write-md>
```

```js
import { autoloader } from '@aufbau/components';
autoloader();   // the elements' autoloader comes along
```

## how a component is built

- a composition of elements in the **light dom**. the skin is adopted by the
  document and selects the elements by tag, a shadow root would shut it out. a
  component draws no chrome of its own.
- **one inner element holds the value** (`static control`). the component hands
  it its attributes (`name`, `required`, `disabled`, `persist`, … plus `static
  forward`), so the form sees exactly one control. validity, reset, persist and
  the `input`/`change` events are that element's. helper elements (a search
  field, a tab switch) are muted with `mute()`.
- **the value is a string with a fixed format**, the same in the attribute and in
  FormData.
- listeners on the inner elements go into `bind()`. it runs after the first
  render and again on every reconnect, a disconnect releases them.

three bases in `core/`: `InputComponent` (one `aufbau-input` of a type),
`OptionsComponent` (an `aufbau-picker` with options built from data, rebuilt
when they or the language change), `SearchComponent` (a search field and the
hits as a wrapping row).

| component        | value                              | built on / source                          |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `input-bool`     | `value` or `on` when checked       | `aufbau-toggle`                            |
| `input-chips`    | `red,green` (`separator`)          | `aufbau-input`, chips as `aufbau-button`   |
| `input-color`    | `#ff8800`                          | `aufbau-input type=color`, swatch          |
| `input-country`  | iso 3166-1: `DE`                   | `Intl.DisplayNames`, circle-flags          |
| `input-currency` | iso 4217: `EUR`                    | `Intl.supportedValuesOf`                   |
| `input-date`     | `2026-09-30`                       | `aufbau-input type=date`                   |
| `input-email`    | an address                         | `aufbau-input type=email`                  |
| `input-emoji`    | the character: `😀`                | search over the unicode names              |
| `input-font`     | webfonts id: `manrope`             | `@aufbau/webfonts`                         |
| `input-hotkey`   | `Ctrl+Shift+K`                     | recorded from the keyboard                 |
| `input-icon`     | iconify id: `bx:search`            | iconify search api                         |
| `input-item`     | one of the options (`multiple`)    | `aufbau-picker`, children or `src`         |
| `input-language` | bcp 47: `de`, `pt-BR`              | iso 639-1, `Intl.DisplayNames`             |
| `input-locale`   | bcp 47 with region: `de-AT`        | a working set, `Intl.DisplayNames`         |
| `input-number`   | a number                           | `aufbau-input type=number`                 |
| `input-password` | a password                         | `aufbau-input`, a toggle to show it        |
| `input-phone`    | a phone number                     | `aufbau-input type=phone`                  |
| `input-search`   | a query, `search` event debounced  | `aufbau-input`                             |
| `input-slug`     | `ueber-uns`, follows `source`      | `aufbau-input`                             |
| `input-text`     | a line of text                     | `aufbau-input`                             |
| `input-time`     | `14:30`                            | `aufbau-input type=time`                   |
| `input-timezone` | iana: `Europe/Berlin`              | `Intl.supportedValuesOf`                   |
| `input-unit`     | `kilometer`                        | `Intl.supportedValuesOf`                   |
| `input-url`      | `https://…`, scheme added          | `aufbau-input type=url`                    |
| `input-year`     | `2026`                             | `aufbau-input type=year`, stepper          |
| `write-md`       | markdown                           | `aufbau-writer`, `aufbau-reader`           |

### app

the frame of an app: `app-root` holds areas and views and sets the look below
it, `app-area` is a region of it, `app-view` one screen. `app-panel`,
`app-config` and `app-float` are what goes into them.

```html
<app-root palette="zombie" scheme="dark" density="touch" skin="monochrome" loading>
  <app-area name="main">
    <app-view name="library" route="/" active>…</app-view>
    <app-view name="reader" route="/reader" transition-on="slide">…</app-view>
    <app-float anchor="bottom-end">…</app-float>
  </app-area>
  <app-area name="menu" dock="start"><app-panel heading="Menu">…</app-panel></app-area>
  <app-area name="config" dock="end"><app-panel heading="Settings"><app-config></app-config></app-panel></app-area>
  <app-area name="context" dock="bottom" peek>…</app-area>
</app-root>
```

- `app-root`: palette, scheme, density and geometry hold for everything below
  it (data-* on it). the skin is the document's: `skin` sets it on `<html>` and
  swaps the elements' skin. every attribute is a property too, `root.palette =
  'oled'`. `loading` shows a screen until `ready()` (the palette's background
  and a spinner, or a child with `[data-loading]`). `routing="hash | path |
  none"`, `transition` is the default view transition. `show(name)`,
  `area(name)`, event `navigate`. with areas it is a grid: the main one in the
  middle, the docked ones at start, end and bottom. views without areas work as
  before.
- `app-area`: `name` says what it is, `dock="start | end | bottom"` where it
  sits; without dock it is the main area, which holds the views. a docked area
  is a sidebar or a sheet on wide screens and a drawer below `breakpoint`
  (48rem), `overlay="always | never"` forces either. `open`, `expanded` (wider
  or taller, full screen as a drawer), `peek` (a closed bottom drawer keeps its
  handle on screen). the handle drags and taps it open and shut, up again
  expands; escape and the scrim close a drawer and the rest of the app is inert
  meanwhile. no swipe from the screen edge: android takes those for back and
  home. `show()`, `hide()`, `toggle()`, `expand()`, event `toggle`, state
  `:state(overlay)`. its chrome (scrim, handle) is in a shadow root, the
  children stay the author's.
- `app-view`: one of the views of a parent is active, the others are `inert`
  and `content-visibility: hidden`, so their dom, form values and scroll stay.
  `activate()` or setting `active` switches inside a view transition,
  `transition-on` / `transition-off` name a one-way keyframe (fade, slide, zoom,
  pop, rotate-in) or none. `lazy` renders the `<template>` child on the first
  activation, `route` puts the view into the address. events `activate`,
  `deactivate`.
- `app-panel`: a header with `heading`, slots `start` and `actions`, and the
  buttons to close and expand what it sits in: an area is hidden or expanded,
  an `aufbau-modal` closed. `controls="close expand"` names the buttons there
  may be; they only show where they can act.
- `app-config`: a settings form from an `@aufbau/gui` spec. `spec` and `values`
  are properties, event `config { key, values }`. content only, the frame is
  the app's.
- `app-float`: floats over its positioned ancestor (an area or a view) on one
  of nine anchors (`top-start` … `bottom-end`), its children stack in
  `direction="up | down | start | end"`.

### div

`div-x` is a row, `div-y` a column: flex containers along their axis.
`scrollable` lets them scroll along it instead of growing.

```html
<div-y>
  <div-x scrollable>…</div-x>
</div-y>
```

### embed

third party content behind a click, one component per provider over
`<aufbau-embed>` (no request to the provider before the click, `consent`,
`remember`, `height`, `width`, `ratio`, `poster`, `label` as there).

| component          | src                                                       |
| ------------------ | --------------------------------------------------------- |
| `embed-youtube`    | url or video id, `start="1m30s"`                          |
| `embed-vimeo`      | url or video id                                           |
| `embed-spotify`    | url, `spotify:` uri, or id with `type="track"` (default)  |
| `embed-soundcloud` | url                                                       |
| `embed-mastodon`   | post url                                                  |
| `embed-bandcamp`   | id, player url or the whole embed snippet                 |

`embed-bandcamp` takes `type="release | track"` and the styles of bandcamp's
embed dialog as `look`: `slim`, `slim-plain`, `standard`, `standard-short`,
`artwork`, `wide`. its colors follow the palette (`--color-bg`, `--color-ink`),
`bgcol` and `linkcol` override them. the id is not in the page urls, it comes
from bandcamp's own embed code; a page url turns the placeholder into a link.

```html
<embed-youtube src="dQw4w9WgXcQ"></embed-youtube>
<embed-bandcamp src="3119776030" look="slim"></embed-bandcamp>
```

the list components (country, currency, font, item, language, locale,
timezone, unit) take the looks of `aufbau-picker`: `look="combobox | cycle |
radio | segments"`, plus `searchable` and `stepper`.

the language a component shows its names in is the nearest `[lang]`, then the
document, then the browser.

## tags

each component is `<group>-<name>`, in `./<group>/<name>.js`. only the
components can be renamed, the elements inside keep their `aufbau-*` tags:

```js
autoloader({ prefix: 'x-' });                           // <x-input-icon>
autoloader({ rename: { 'input-icon': 'icon-field' } });  // <icon-field>
```

## htx

the components are real tags, so htx only learns what their positional values
fill. the adapter exports them under the camelCase of the tag, which htx (from
0.2) reads as its kebab-case. the elements keep their `$` shorthands.

```js
import * as components from '@aufbau/components/htx';
import * as elements   from '@aufbau/elements/htx';

html.define({ ...elements, ...components });

html`<input-color 'red' name="color" />`   // <input-color value="red" name="color">
html`<embed-youtube 'dQw4w9WgXcQ' />`      // <embed-youtube src="dQw4w9WgXcQ">
html`<$icon 'lucide:star' />`              // <aufbau-icon icon="lucide:star">
```

the adapter knows the canonical tags. a component renamed by configure() is
defined for htx under its new name: `html.define({ xInputColor: { args: 'value' } })`.

## notes for later

- one `input-*` per value domain. where a domain could be typed or picked
  (date, color, year, time) the typed field is what there is for now, a picker
  look (calendar, swatches) would come as `look`.
- `input-icon` and `input-emoji` show the hits as a wrapping segments row. a
  grid look for `<aufbau-picker>` would suit them better, that is a change in
  the elements.
- `input-emoji` knows single code points only (1150), no zwj sequences, skin
  tones or flags. the names are english unicode names, not the cldr keywords.
- `input-phone` could take an `input-country` for the prefix.
- the list components do not follow a change of `[lang]` above them until one
  of their own attributes changes.
- candidates for elements rather than components: `<aufbau-embed>` (a click to
  load facade for youtube, bandcamp, …) and `<aufbau-indicator type="error |
  loading | success | empty">`.
