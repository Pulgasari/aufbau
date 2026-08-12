# @aufbau/utils/fp

Funktionaler Werkzeugkasten: Komposition (`pipe`/`compose`), Pattern Matching
(`match`), 75 Predicates und data-last Operationen für Arrays, Objekte und Strings.

> **Status:** ersetzt `utils/*` **nicht** und ist bewusst *nicht* in
> `utils/index.js` verdrahtet. Wer `fp` will, importiert es explizit.
> Grund: alle ~70 `isX`-Namen kollidieren mit `utils/is.js`, und `export *`
> verschluckt mehrdeutige Namen kommentarlos.

---

## Aufbau

Die Schichtung ist azyklisch, jede Datei importiert nur nach links:

```
core.js  ──▶  predicates.js  ──▶  is.js  ──▶  match.js
   │                                              
   └──▶  array.js · object.js · string.js
```

| Datei | Inhalt |
|---|---|
| `core.js` | `pipe`, `compose`, `curry`, `identity`, `constant`, `tap`, `once`, `not`, `and`, `or` |
| `predicates.js` | 75 rohe Predicates unter ihren Klarnamen (`string`, `even`, `blank` …) |
| `is.js` | Registry, `test`, der `is`-Proxy, alle `isX`-Aliase |
| `match.js` | `match`, `when`, `unless`, `ifElse` |
| `array.js` | `map`, `filter`, `reduce`, `take`, `uniq` … plus Sequence-Ops für Arrays *und* Strings |
| `object.js` | `prop`, `path`, `pick`, `omit`, `assoc`, `merge` … |
| `string.js` | `trim`, `toLower`, `replace`, `split`, `slugify` … |

---

## Import

```javascript
// bequem: alles ausser den rohen Predicates
import { pipe, match, is, map, trim } from '@aufbau/utils/fp';

// gezielt: nur was du brauchst, bestes tree-shaking
import { pipe }        from '@aufbau/utils/fp/core.js';
import { even, filled} from '@aufbau/utils/fp/predicates.js';
```

Der Barrel exportiert **keine** rohen Predicate-Namen. `map` (Array-Op) und `map`
(„ist eine Map") würden kollidieren, `set`, `string`, `number` und `object` genauso.
Klarnamen kommen deshalb ausschliesslich per Deep-Import aus `predicates.js`.

Zweiter Grund für den Deep-Import: `is.js` referenziert über seine Registry
**jedes** Predicate. Wer `is` anfasst, zieht alle 75 in den Bundle. Wer nur
`import { even } from './predicates.js'` schreibt, bekommt genau eine Funktion.

---

## pipe & compose

Statt `h(g(f(x)))` eine lesbare Kette. 

`pipe` läuft links nach rechts (das ist in 90 % der Fälle das, was du willst).

`compose` rechts nach links wie die mathematische Notation.

```javascript
import { pipe }                    from '@aufbau/utils/fp';
import { slice }                   from '@aufbau/utils/fp/array.js';
import { replace, toLower, trim }  from '@aufbau/utils/fp/string.js';

const slugify = pipe(
  trim,
  toLower,
  replace(/\s+/g, '-'),        // leerzeichen zu bindestrichen
  replace(/[^a-z0-9-]/g, ''),  // ungültige zeichen raus
  slice(0, 15)                 // auf 15 zeichen kürzen
);

slugify(' Functional Programming JS! ');  // 'functional-prog'
```

Die Reihenfolge ist nicht kosmetisch: ohne `toLower` vor dem Zeichenklassen-Filter
löscht `[^a-z0-9-]` jeden Grossbuchstaben statt ihn zu behalten.

`pipe` und `compose` sind für 0–3 Stufen spezialisiert und fallen erst darüber auf
eine Schleife zurück — kein Reducer-Closure pro Aufruf.

---

## curry

`curry` macht aus einer Funktion mit fester Stelligkeit eine, die ihre Argumente
auch häppchenweise annimmt. Beide Schreibweisen funktionieren.

```javascript
import { curry, pipe } from '@aufbau/utils/fp';

const add      = curry((a, b) => a + b);
const multiply = curry((a, b) => a * b);

add(5, 10);  // 15
add(5)(10);  // 15

const withVat = pipe(
  add(10),               // vorkonfiguriert: addiert 10
  multiply(1.19),        // vorkonfiguriert: 19 % mwst
  value => value.toFixed(2)
);

withVat(100);  // '130.90'  ((100 + 10) * 1.19)
```

**Achtung Stelligkeit:** `curry` liest `fn.length`, und das zählt bei Default- und
Rest-Parametern nur bis zum ersten davon. Dann die Stelligkeit explizit angeben:

```javascript
const raw = (a, b = 2, c = 3) => a + b + c;

curry(raw)(1);     // 6  — feuert sofort, weil fn.length === 1
curry(raw, 3)(1);  // function — wartet korrekt auf b und c
```

Die Operationen in `array.js`/`object.js`/`string.js` sind bewusst **von Hand**
data-last geschrieben statt über `curry` erzeugt: das spart auf heissen Pfaden
einen Rest-Spread pro Teilanwendung.

---

## is

Drei Aufrufarten, ein Regelbegriff:

```javascript
import { is } from '@aufbau/utils/fp';
import { even, number } from '@aufbau/utils/fp/predicates.js';

is.string('hallo');           // true   — direkter zugriff
is('email')('a@b.de');        // true   — regel per name
is([number, even])(4);        // true   — [] = alle müssen passen
is('doesNotExist')(42);       // false  — unbekannte namen matchen nie
```

Die Namensvariante ist der eigentliche Hebel: Regeln können aus einem Attribut,
einer JSON-Config oder einem Schema kommen, ohne dass du Funktionen serialisieren
musst.

```javascript
const rules = JSON.parse(element.dataset.validate);  // ['string', 'filled']
is(rules)(element.value);
```

**Performance:** jeder Property-Zugriff auf `is` läuft durch den Proxy-Trap. In
Schleifen einmal destrukturieren oder gleich die Klarnamen importieren:

```javascript
const { number, string } = is;              // ein trap-durchlauf statt n
for (const item of hugeList) if (number(item)) …
```

Unbekannte Keys liefern `undefined` statt bis zu `Function.prototype`
durchzufallen — `is[nameAusFremddaten]` kann also nie `call`, `bind` oder
`constructor` herausgeben.

---

## match

Ersetzt if/else-Ketten und `switch` durch eine Tabelle aus `[Regel, Handler]`-Paaren.
Die erste passende Regel gewinnt, Handler dürfen Funktionen oder Konstanten sein.

Vorher:

```javascript
function classify (input) {
  if (input === null || input === undefined) return 'leer';
  else if (typeof input === 'string') return input.trim().toUpperCase();
  else if (typeof input === 'number' && Number.isInteger(input) && input % 2 === 0) return input * 100;
  else if (Array.isArray(input)) return `array mit ${input.length}`;
  else return 'unbekannt';
}
```

Nachher:

```javascript
import { match } from '@aufbau/utils/fp';

const classify = match([
  ['blank',             () => 'leer'],
  [['number', 'even'],  value => value * 100],   // [] = UND-verknüpfung
  ['string',            value => value.trim().toUpperCase()],
  ['array',             value => `array mit ${value.length}`]
], () => 'unbekannt');                            // fallback

classify(null);       // 'leer'
classify(4);          // 400
classify('  hi ');    // 'HI'
classify([1, 2, 3]);  // 'array mit 3'
classify(true);       // 'unbekannt'
```

Regeln dürfen Predicate-Namen, Funktionen, Booleans oder verschachtelte Arrays
davon sein — `match` und `is` teilen sich denselben Evaluator (`test`).

```javascript
const handleResponse = match([
  [response => response.status === 200, response => response.json()],
  [response => response.status === 401, () => redirect('/login')],
  [response => response.status >= 500,  () => showError('Serverfehler')]
], () => showError('Unerwarteter Status'));
```

Für den Einzelfall reichen die kleineren Geschwister:

```javascript
import { ifElse, unless, when } from '@aufbau/utils/fp';

when('string', trim)(' x ');    // 'x'
when('string', trim)(5);        // 5 — regel greift nicht, wert bleibt
unless('array', value => [value])('x');   // ['x']
ifElse('blank', () => 'n/a', String)(0);  // '0'
```

---

## Daten-Operationen

Alle data-last, also direkt pipe-tauglich.

```javascript
import { pipe }                     from '@aufbau/utils/fp';
import { filter, join, map, take }  from '@aufbau/utils/fp/array.js';
import { pick, prop }               from '@aufbau/utils/fp/object.js';

const topNames = pipe(
  filter(user => user.active),
  map(prop('name')),
  take(3),
  join(', ')
);

topNames([
  { name: 'Ada',   active: true  },
  { name: 'Grace', active: false },
  { name: 'Alan',  active: true  }
]);  // 'Ada, Alan'
```

`sort`, `reverse` und `uniq` kopieren vorher — die nativen Methoden mutieren.
`slice`, `at`, `concat`, `includes` und `indexOf` liegen in `array.js`, laufen
aber auf Arrays **und** Strings.

`object.js` und `string.js` sind dünne data-last Hüllen um `utils/object.js` und
`utils/string.js` — die Implementierungen bleiben an einer Stelle. Einzige
Ausnahme: `deepMerge` wird nicht gewrappt, weil es sein Ziel mutiert. Das `merge`
hier ist ein reiner, flacher Merge.

---

## Predicate-Referenz

Klarnamen aus `predicates.js`, `isX`-Aliase aus `is.js`, Namen für `is('…')`/`match`
aus der Registry.

**Primitive** `bigInt` · `boolean` · `defined` · `func` · `null_` · `nullish` ·
`primitive` · `string` · `symbol` · `undefined_`
*(als Regelname: `function`, `null`, `undefined`)*

**Zahlen** `even` · `finite` · `float` · `integer` · `nan` · `negative` ·
`number` · `numeric` · `numericString` · `odd` · `positive` · `year` · `zero`

**Objekte & Strukturen** `array` · `asyncIterable` · `buffer` · `date` · `error` ·
`iterable` · `map` · `object` · `plainObject` · `promise` · `realObject` ·
`regExp` · `set` · `strictObject`

**DOM & Umgebung** `canvas` · `domNode` · `element` · `elementish` ·
`externalUrl` · `fragment` · `internalUrl` · `node` · `nodeList` · `realNodeList`

**Leere** `blank` · `blankish` · `empty` · `emptyArray` · `emptyMap` ·
`emptyObject` · `emptySet` · `emptyString` · `filled`

**Formate** `alphaNumeric` · `base64` · `dateString` · `email` · `hexColor` ·
`html` · `json` · `url` · `uuid`

**Schreibweisen** `camelCase` · `constantCase` · `kebabCase` · `lowerCase` ·
`pascalCase` · `snakeCase` · `upperCase`

**Listen** `entriesList` · `objectList` · `stringList`

---

## Fallstricke

- **`object(new Date)` ist `true`.** `object` heisst „typeof object und kein Array",
  nicht „plain object". Dafür gibt es `plainObject`, `realObject` und `strictObject`.
- **`empty(() => {})` ist `true`.** `empty` prüft unter anderem `.length === 0`,
  und eine Funktion ohne Parameter hat `length === 0`. Bei Funktionen vorher
  `func` ausschliessen.
- **`blankish` ist nicht „falsy".** Es schliesst `0` und `false` aus, deckt also
  `null`, `undefined`, `''` und `NaN` ab. Der alte Name `falsy` existiert noch
  als Alias, war aber schlicht falsch.
- **`html` verträgt kein mehrzeiliges Markup.** Das Regex nutzt `.`, das keine
  Zeilenumbrüche matcht.
- **`internalUrl`/`externalUrl` ohne `window`** (Node, Deno, SSR): `internalUrl`
  ist dann immer `false`, `externalUrl` prüft ersatzweise auf eine absolute URL.
- **`defined` ist nicht das Gegenteil von `nullish`.** `defined(null)` ist `true`,
  geprüft wird nur gegen `undefined`.

### Umbenannt

| jetzt | vorher | warum |
|---|---|---|
| `blankish` / `isBlankish` | `falsy` / `isFalsy` | schliesst `0` und `false` aus, ist also nicht falsy |
| `dateString` / `isDateString` | `date2` / `isDate2` | die Zahl im Namen sagt nichts |

Die alten Namen bleiben als Alias bestehen.

### Repariert gegenüber dem ersten Entwurf

- `html` matchte nie: beim Einfügen war ein LaTeX-Artefakt (`$\vert{}^`) statt der
  Alternation `|` im Regex gelandet. `\v` ist ein gültiges Escape, deshalb hat es
  nicht geworfen, sondern still nichts erkannt.
- `emptyString(0)` und `emptyString(null)` gaben `true` zurück — es fehlte der
  String-Check.
- `base64('')` gab `true` zurück, beide Regex-Gruppen sind optional.
- `is.constructor` lieferte den `Object`-Konstruktor, weil die Registry-Prüfung
  mit `in` die Prototypenkette mitlief.
- `is.js` und `is2.js` waren zu 95 % derselbe Code.

---

# ready.js — die boot-schranke

`gate()` und `ready()` sind der einzige ort, an dem aufbau "fertig" überhaupt
ausspricht. vorher gab es kein signal: `observeStylesheets()` gibt `undefined`
zurück, `processStylesheets()` warf jedes promise weg, das es erzeugte, und
`aufbau.init()` resolved, lange bevor ein einziges stylesheet kompiliert ist.

```javascript
import { gate, ready, readyState } from '@aufbau/js';

gate('app', ladeDaten());                       // promise oder thunk, benannt
const report = await ready({ timeout: 8000 });
// { ok: false, elapsed: 8001, timedOut: true,
//   gates: { stylesheets: 'ok', elements: 'ok', app: 'pending' } }
```

Zwei Eigenschaften machen es sicher, einen Ladebildschirm daran zu hängen:

- **`ready()` rejected nie.** Ein Gate, das wirft, wird geloggt und zählt als
  erledigt.
- **`ready()` hängt nie.** Die Deadline löst es so oder so auf.

Der benannte Report ist der eigentliche Wert des Timeout-Pfads: er sagt, *woran*
es hing, nicht bloss dass etwas hing.

`minimum` hält die Auflösung zurück, damit das nicht jeder Aufrufer nachbaut.
Gates, die nach dem Auflösen registriert werden, werden ignoriert — das ist eine
einmalige Boot-Schranke, keine Task-Queue.

| gate | registriert von | default |
|---|---|---|
| `stylesheets` | `@aufbau/plugins/client` | an |
| `elements` | `@aufbau/elements` | an |
| `fonts` | `@aufbau/kits`, über `configs.splash.fonts` | aus |

## quiescent(set)

Die Helper hinter den beiden Standard-Gates. Beide Arbeitsmengen werden von
MutationObservern gefüttert, können sich also jederzeit wieder füllen. Ein
`size === 0`-Test allein würde bei t=0 durchgehen, bevor der erste Eintrag
überhaupt eingereiht war — `quiescent` wartet deshalb darauf, dass die Menge leer
ist **und einen Frame lang leer bleibt**.
