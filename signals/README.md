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
state.onEffects ({
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

---

# TODO

- [ ] `BetterSignal.js` in saubere Klasse überführen
- [ ] `DeepSignal.js` in saubere Klasse überführen
- [ ] `QuerySignal.js` in saubere Klasse überführen
- [ ] imports/exports prüfen und korrigieren

Hinweise:

1. Als utils nutzen wir `pulgasari/js/is.js` (`@pulgasari/is`) und `pulgasari/js/obj.js` (`@pulgasari/obj`), wobei wir das genutzte Zeug am Ende vllt direkt in die `shared.js` kopieren.

2. Intern lassen wir alle Deps und Utils über `shared.js` laufen zwecks Übersichtlichkeit.
