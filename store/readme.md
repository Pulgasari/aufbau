# @aufbau/store

Aufbau's persistence preset.

No storage logic lives here — that is all [`@bunker/storage`](https://github.com/pulgasari/bunker).
What this package owns is the aufbau-specific part: one namespace, one version, and
the `persist` attribute contract the elements speak.

```javascript
import { store, session } from '@aufbau/store';

store.setSync('theme', 'oled');
store.getSync('theme', 'classic');   // 'oled', or the fallback
session.setSync('draft', { … });
```

Nothing throws. A full quota returns `false`, and in private mode the whole thing
falls back to memory — every call keeps working, nothing survives the reload.

## The four stores

| | |
| --------- | ------------------------------------------------------- |
| `store`   | localStorage, JSON. Themes, skins, control values |
| `session` | sessionStorage, JSON |
| `sheets`  | compiled CSS by href, raw text |
| `pages`   | which stylesheets a page uses, by pathname |

`sheets` and `pages` exist for the boot path. `boot.js` reads both synchronously
before the first paint — see the root readme. They are stored as raw text rather
than JSON because the boot read pulls a whole stylesheet and should not pay for
escaping a value that is already a string.

## The persist attribute

```html
<aufbau-toggle name="dark" persist></aufbau-toggle>
<aufbau-picker persist="session:filter"></aufbau-picker>
```

```
persist                  local,   key from name or id
persist="session"        session, key from name or id
persist="theme"          local,   key "theme"
persist="session:theme"  session, key "theme"
```

`AufbauControl` calls `resolvePersist()` to turn that into a store and a key. The
grammar lives here rather than in the element so the element does not have to know
about namespaces, quotas or private mode.

## Versions

Everything is written under `aufbau:v1:`. Bumping the version in this file orphans
every entry at once; `sweep()` clears the orphans out.

```javascript
import { sweep } from '@aufbau/store';
sweep(); // returns how many stale entries went
```
