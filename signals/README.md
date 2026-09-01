# @aufbau/signals

a customized/extended version of the `@preact/signals` library.

## signal

Eigentlich hätte ich hierfür evtl. gern einen eigenständigen Namen, aber mir fällt kein guter ein. Interner Arbeitstitel ist `betterSignal` aber ist halt auch dumm.

Vielleicht passt `signal` ja auch, weil es die ursprüngliche Methodik der originalen signals weiterhinkinn und alles neue/zusätzliche letztlich ja vereint?

```javascript
import { signal } from '@aufbau/signals';

let theme = signal({ type: String, value: 'dark', key: 'theme', store: local });
let mode  = signal({ value: 'on', values: ['on','off'], key: 'mode', store: cookie({ days: 7 }) });
let ui    = signal({ value: { sidebar: true }, key: 'ui', store: session, deep: 2 });
let tags  = signal({ type: Set, value: [], key: 'tags', store: local });
let plain = signal('blubb');

mode.cycle();        // on -> off -> on
mode.value = 'xl';   // ignoriert + console.warn
await theme.$ready;  // erst nach Hydration
```

## deepSignal

```javascript
import { deepSignal } from '@aufbau/signals';

const state = deepSignal({
  dir    : 'ltr',
  dialog : null,
  route  : null,
  font   : 'Manrope',
});

// :::::: EFFECTS

// variant 1 (regular)
effect(() => document.documentElement.setAttribute('dir', state.dir));
effect(() => aufbau.webfonts.init({ name: state.font, target: '--font' }));

// variant 2
state.$onEffects ({
  dir  : (value) => $root?.setAttribute('dir', value),
  font : (value) => aufbau.webfonts.init({ name: value, target: '--font' }),
});
```

## querySignal

```javascript
let icons = querySignal(fakeFetcher({ delay: 400, fail: 0.1, total: 250 }), {
  infinite: true, prefetch: true, limit: 20,
  deps: () => [query.value],
  enabled: () => query.value.length > 1,
});
icons.value.data;          // flach, egal ob infinite
icons.fetchNextPage();
icons.refetch();
```

## scalarSignal

## boolSignal

```javascript
import { boolSignal, signal } from '@aufbau/signals';

let open = boolSignal(false);
open.toggle();   // true
open.off();      // false
open.value = 1;  // coerced -> true

// persisted via the factory
let dark = signal({ type: Boolean, value: true, key: 'dark', store: local });
```

---

# TODO

- [x] `BetterSignal.js` aufgeräumt: carrier-builder + persistence getrennt, toter/auskommentierter code raus. keine echte klasse — es ist ein factory, kein typ (nur `betterSignal`, kein `BetterSignal`).
- [x] `DeepSignal.js` aufgeräumt. bleibt bewusst Proxy-basiert (per-leaf-signal identity braucht das), also keine ES-klasse. `deepSignal` ist die ganze surface, `isDeep` der brand-check. `$replace` ergänzt, `$toggle` auf die echte `obj.toggleByPath` gezogen, `$ready` jetzt schreibbar.
- [x] `QuerySignal.js` aufgeräumt/imports gefixt. bleibt eine closure (reichert ein preact-signal an, kein separates objekt zum klassifizieren).
- [x] `BoolSignal` gebaut. Class + factory (`boolSignal`), coerct jeden write auf boolean, `toggle()`/`on()`/`off()`. übers factory via `type: Boolean`.
- [x] imports/exports geprüft/korrigiert. alle vendor-deps laufen jetzt ausschließlich über `shared.js`; `index.js` exportiert die volle surface inkl. stores.

Offen:

- **naming.** das erweiterte factory wird aktuell als `signal` UND `betterSignal` exportiert. preacts rohes `signal`/`Signal` läuft als `preactSignal`/`PreactSignal`. name am ende nochmal final festzurren.
- `shared.js` re-exportiert nur das tatsächlich genutzte. `arr` (`@pulgasari/arr`) ist hier raus — wird nicht gebraucht, und die upstream-datei hat aktuell einen syntax-fehler (`.[mode]`) plus doppelte `export const`. separat zu fixen.

Hinweise:

1. Als utils nutzen wir `pulgasari.github.io/js/is.js` (`@pulgasari/is`) und `pulgasari.github.io/js/obj.js` (`@pulgasari/obj`) und `pulgasari.github.io/js/arr.js` (`@pulgasari/arr`), wobei wir das genutzte Zeug am Ende vllt direkt in die `shared.js` kopieren? Und `obj` und `arr` befinden sich selbst noch in der Entstehung. Also sollten wir da Lücken, Fehler usw. finden, können wir das direkt als Nebentask mit korrigieren/erweitern usw.

2. Intern lassen wir alle Deps und Utils über `shared.js` laufen zwecks Übersichtlichkeit.

3. Bei Unklarheiten, bitte bei mir nachfragen. Assumen könnte hier schnell falsch sein.
