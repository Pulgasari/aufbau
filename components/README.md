# @aufbau/components

ready to use components, composed of `@aufbau/elements`. the elements are the
primitives (a picker, a writer, an input), the components bring the domain: a
data source, a fixed value format, the language they are shown in.

```html
<pick-language name="lang" value="de"></pick-language>
<pick-icon name="icon" value="lucide:star" prefixes="lucide bx"></pick-icon>
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

| component       | value                     | source                                   |
| --------------- | ------------------------- | ---------------------------------------- |
| `pick-icon`     | iconify id: `bx:search`   | iconify search api                       |
| `pick-language` | bcp 47: `de`, `pt-BR`     | iso 639-1, `Intl.DisplayNames`           |
| `write-md`      | markdown                  | –                                        |

the language a component shows its names in is the nearest `[lang]`, then the
document, then the browser.

## tags

each component is `<group>-<name>`, in `./<group>/<name>.js`. only the
components can be renamed, the elements inside keep their `aufbau-*` tags:

```js
autoloader({ prefix: 'x-' });                          // <x-pick-icon>
autoloader({ rename: { 'pick-icon': 'icon-field' } });  // <icon-field>
```

## htx

```js
import * as components from '@aufbau/components/htx';
import * as elements   from '@aufbau/elements/htx';

html.define({ ...elements, ...components });
```

## notes for later

- `pick-*` and `input-*` overlap on some value domains (date, color, year). kept
  apart on purpose for now, maybe worth a second look.
- `pick-icon` shows the hits as a wrapping segments row. a grid look for
  `<aufbau-picker>` would suit it better, that is a change in the elements.
- `pick-icon` searches as the user types, inside the list of a combobox that
  does not work: the picker rebuilds its shadow markup, field included, when the
  options change. hence the separate field.
- `pick-language` does not follow a change of `[lang]` above it until one of
  its own attributes changes.
- candidates for elements rather than components: `<aufbau-embed>` (a click to
  load facade for youtube, bandcamp, …) and `<aufbau-indicator type="error |
  loading | success | empty">`.
