# @aufbau/api

unified async wrapper around most aufbau-packages with lazy imports.

## install

```sh
deno install jsr:@aufbau/api
```

## usage

nothing is imported up front. every namespace imports its package on the first
call, so every method is async.

```javascript
import aufbau from '@aufbau/api';

await aufbau.boot({ css: { theme: 'oled' }, font: ['manrope'] });
```

### one package

`filters`, `patterns` and `webfonts` share one contract:

| method                       | does                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `apply(target, id, options)` | applies one effect to a selector, element or list      |
| `update(target, options)`    | new options for what is already on the targets         |
| `remove(target, options)`    | takes it off again                                     |
| `use(id, options)`           | a handle bound to one id (`Filter`, `Pattern`, `Font`) |
| `load(id)`                   | loads the implementation or the files only             |
| `list()` / `data`            | the catalogue                                          |

```javascript
await aufbau.filters.apply('#logo', 'blur', { amount: 4 });
await aufbau.patterns.apply('.hero', 'grid', { fg: '#334', motion: 'down' });
await aufbau.webfonts.apply('.article', 'vollkorn', { role: 'serif' });
```

### several at once

keys `filter`, `font`, `pattern`. a value is an id, `{ id, ...options }` or
`[id, options]`, `null` removes that kind.

```javascript
await aufbau.apply('#hero', {
  filter  : 'grain',
  font    : ['lexend', { role: 'heading' }],
  pattern : { id: 'dots', fg: '#f00' },
});

await aufbau.update('#hero', { pattern: { fg: '#0f0' } });
await aufbau.remove('#hero', ['pattern']);   // every kind without the list
```

### elements, data, theme

```javascript
await aufbau.elements.enableAutoload();   // returns the stop function
await aufbau.elements.registerAll();
await aufbau.elements.setConfig({ code: { theme: 'nord' } });

await aufbau.data.filters;    // also icons, patterns, themes, webfonts. each one a promise
await aufbau.gestalt.set({ theme: 'oled' });   // see gestalt.js
await aufbau.gestalt.themes();                 // the presets, read off css/themes.css
```

### boot config

```javascript
{
  css      : { layout: false, look: 'flat', reset: true, skin: 'monochrome', theme: 'zombie' },
  elements : { mode: 'auto' },   // 'auto' | 'all' | false, every other key is element config
  font     : ['manrope'],        // webfonts.init()
}
```

---

# TODO:

- es ersetzt `aufbau/runtime` (entfernt), ohne es zu reproduzieren. der ansatz hier ist pragmatischer und einfacher gedacht.

- wird schrittweise implementiert/konstruiert weil ich mir über endgültige shape in allen details noch nicht 101pro sicher bin.

- grundsätzlich sollte hier alles möglichst lazy importiert/angedockt werden.

- für aufbau/filters, aufbau/patters, aufbau/webfonts (und gestures?) gilt aber schonmal.dass sie ne möglichst gleichförmige öffentliche api haben (zb apply, remove, update, use) sodass sie aufbau/api einerseits lazy durchreichen/wrappen kann, sowie ne ähnliche toplevel api mitbringt, diese dann gruppiert angeben kann. konkrrt was ich meine:

```md
import aufbau from `@aufbau/api`;

// so kann mans regulär nutzen

aufbau.filters.apply(...)
aufbau.filters.remove(...)
aufbau.filters.update(...)

aufbau.patterns.apply(...)
aufbau.patterns.remove(...)
aufbau.patterns.update(...)

aufbau.webfonts.apply(...)
aufbau.webfonts.remove(...)
aufbau.webfonts.update(...)
```

aber zusätzlich gibts quasi zb:

```
aufbau.apply( element, {
  filter  : { ... },
  pattern : { ... },
};
```

und sowieso:

```
aufbau.elements.enableAutoload(...);
aufbau.elements.setConfig(...);
```

und so weiter.

- ich hab auch irgendwie so n `data` (vllt anderer name?) namespace im sinn:

```
aufbau.data.filters
aufbau.data.icons
aufbau.data.patterns
aufbau.data.webfonts
```

um derlei infos parat zu haben.

---

## kandidaten ...

... die hier evtl. (!) irgendwie angedockt werden. bin mir noch nich 100pro sicher was davon letztlich sinn macht und praktikavel wäre.

```
@aufbau/ass
@aufbau/elements
@aufbau/gui
@aufbau/icons
@aufbau/import

@aufbau/filters
@aufbau/gestures
@aufbau/patterns
@aufbau/webfonts

# experimental (bei denen ist aktuemm bissl unklar was damit mittel-/langfristig genau wird
@aufbau/signals
@aufbau/store
@aufbau/stylescript

# tochter-projekte
@bunker
@domina
@htx
```
