# @aufbau/api

unified async wrapper around most aufbau-packages with lazy imports.

## install

```sh
deno install jsr:@aufbau/api
```

---

# TODO:

- es soll gewissermaßen `aufbau/runtime` (wird konplett entfernt) ersetzen aber ohne es zu reproduzieren. der ansatz hier ist pragmatischer und einfacher gedacht.

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
