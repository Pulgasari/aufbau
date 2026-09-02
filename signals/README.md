# @aufbau/signals

a customized/extended version of the `@preact/signals` library.

## signal

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

```javascript
import { signal } from '@aufbau/signals';

export function createState (config = {}) {
  const state = signal({
    key   : 'zugriff:' + config.id + ':',
    store : localStorage,
    value : {
      color    : config.color,
      dir      : config.dir,
      font     : config.font  ?? 'Manrope',
      lang     : config.lang,
      theme    : config.theme ?? 'dracula',
      title    : config.name  ?? null,
      viewport : config.viewport,
  
      // ui-frame state every app shares
      dialog : null,
      route  : null,
    }
  });

  // :::::: EFFECTS

  state.$onEffects({
    dir   : value => { if ($root && value) { $root.setAttribute('dir', value); writeJSON(DIR_KEY, value); } },
    font  : value => { if (value) { aufbau.webfonts?.init?.({ name: value, target: '--font' }); writeJSON(FONT_KEY, value); } },
    lang  : value => { if ($root && value) $root.lang = value; },
    theme : value => applyTheme(value),
    title : value => { if ($doc && value) $doc.title = value; },
  });

  return state;
}
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

## scalarSignal

---

# TODO

- **naming.** das erweiterte factory wird aktuell als `signal` UND `betterSignal` exportiert. preacts rohes `signal`/`Signal` läuft als `preactSignal`/`PreactSignal`. name am ende nochmal final festzurren.
