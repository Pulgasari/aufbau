# @aufbau/api

unified async wrapper around most aufbau-packages with lazy imports.

## install

```sh
deno install jsr:@aufbau/api
```



TODO:

wird schrittweise implementiert/konstruiert weil ich mir über endgültige shape in allen details noch nicht 101pro sicher bin.

grundsätzlich sollte hier alles möglichst lazy importiert/angedockt werden.

für aufbau/filters, aufbau/patters, aufbau/webfonts (und gestures?) gilt aber schonmal.dass sie ne möglichst gleichförmige öffentliche api haben (zb apply, remove, update, use) sodass sie aufbau/api einerseits lazy durchreichen/wrappen kann, sowie ne ähnliche toplevel api mitbringt, diese dann gruppiert angeben kann. konkrrt was ich meine:

```
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

und so weiter

---

## kandidaten ...

... die hier evtl. (!)virgendwie angedockt werden. bin mir noch nich 100pro sicher was davon letztlich sinn macht und praktikavel wäre.

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

@aufbau/signals
@aufbau/store

@bunker
@domina
@htx
```
