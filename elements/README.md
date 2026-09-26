# @aufbau/elements

official **aufbau** *webcomponents\** library.

\* we don't like that begriff and prefer *"(custom) elements"*.

---

**jump to:**
[usage](#usage)
[config](#config)
[elements](#elements)

**preview:** [https://code.pulgasari.dev/aufbau/elements/](https://code.pulgasari.dev/aufbau/elements/)

---

die control-elemente folgen drei achsen: `type` (welcher wert), `look` (wie es
aussieht) und `range`/`multiple` (wie viele). ausführlich in
[controls.md](./controls.md).

```html
<aufbau-option value='de' label='Deutsch'>

<aufbau-picker look='combobox'>
<aufbau-picker look='radio'>
<aufbau-picker look='segments'>

<aufbau-toggle look='switch'>
<aufbau-toggle look='checkbox'>

<aufbau-input type='text'>
<aufbau-input type='number' look='stepper'>

<aufbau-slider type='number' range>
<aufbau-slider type='color'>

<aufbau-upload accept='image/*'>

<aufbau-writer counter maxlength='280'>
<aufbau-reader src='/docs/intro.md'>
```

## usage

### autoloader

the elements load automatically as soon as they appear in the DOM. fits best for usage directly in the browser.

```javascript
import { autoloader } from '@aufbau/elements';
autoloader();
```

```html
<!-- Magic happens:  -->
<aufbau-flag code="de"></aufbau-flag>
<aufbau-slider value="50"></aufbau-slider>
```

### register all elements at once

registers all elements at once. is good for prototyping but in most other cases kinda stupid.

```javascript
import '@aufbau/elements';
```

### register elements one by one

only register the elements you need.

```javascript
import '@aufbau/elements/button';
import '@aufbau/elements/flag';
```

or do it explictily in case you wanna rename the components or whatever.

```javascript
import { AufbauFlag } from '@aufbau/elements/flag';

customElements.define('aufbau-flag', AufbauFlag);
```

```md
<aufbau-avatar>
<aufbau-breadcrumb>
<aufbau-colorpicker>
<aufbau-copy>
<aufbau-dash>
<aufbau-dash-panel>
<aufbau-editor>
<aufbau-epub>
<aufbau-fake> (um so fake elemente zu generieren für testing und prototyping)
<aufbau-flyout>
<aufbau-graph>
<aufbau-gui>
<aufbau-image> (kann zb gifs nicht automatisch abspielen usw>
<aufbau-include>
<aufbau-media> (allrounder?)
<aufbau-menu>
<aufbau-modal>
<aufbau-paginate>
<aufbau-popup>
<aufbau-scroller>
<aufbau-skeleton>
<aufbau-svg>
<aufbau-taplet>
<aufbau-terminal>
<aufbau-toolbar>

<aufbau-action-menu>
<aufbau-context-menu>
<aufbau-menu-item>
```

# elements

[`<aufbau-audio>`](#aufbau-audio) ·
[`<aufbau-button>`](#aufbau-button) ·
[`<aufbau-code>`](#aufbau-code) ·
[`<aufbau-config>`](#aufbau-config) ·
[`<aufbau-crumbs>`](#aufbau-crumbs) ·
[`<aufbau-datalist>`](#aufbau-datalist) ·
[`<aufbau-dropdown>`](#aufbau-dropdown) ·
[`<aufbau-filter>`](#aufbau-filter) ·
[`<aufbau-flag>`](#aufbau-flag) ·
[`<aufbau-icon>`](#aufbau-icon) ·
[`<aufbau-input>`](#aufbau-input) ·
[`<aufbau-keyboard>`](#aufbau-keyboard) ·
[`<aufbau-loop>`](#aufbau-loop) ·
[`<aufbau-modal>`](#aufbau-modal) ·
[`<aufbau-option>`](#aufbau-option) ·
[`<aufbau-picker>`](#aufbau-picker) ·
[`<aufbau-progress>`](#aufbau-progress) ·
[`<aufbau-reader>`](#aufbau-reader) ·
[`<aufbau-skeleton>`](#aufbau-skeleton) ·
[`<aufbau-slider>`](#aufbau-slider) ·
[`<aufbau-table>`](#aufbau-table) ·
[`<aufbau-toc>`](#aufbau-toc) ·
[`<aufbau-toggle>`](#aufbau-toggle) ·
[`<aufbau-tree>`](#aufbau-tree) ·
[`<aufbau-tree-item>`](#aufbau-tree-item) ·
[`<aufbau-upload>`](#aufbau-upload) ·
[`<aufbau-value>`](#aufbau-value) ·
[`<aufbau-video>`](#aufbau-video) ·
[`<aufbau-waveform>`](#aufbau-waveform) ·
[`<aufbau-writer>`](#aufbau-writer) ·

## aufbau-audio

```html
<aufbau-audio 
  src="/media/track.mp3" 
  label="Cyberpunk Theme" 
  artist="Synthwave Studio" 
  cover="/media/cover.jpg"
  layout="card">
</aufbau-audio>
```

## aufbau-button

```html
<!-- 1. Button mit Icon + Attribut-Text -->
<aufbau-button icon="lucide:save" label="Speichern" variant="primary"></aufbau-button>

<!-- 2. Button mit Icon + Custom Children HTML -->
<aufbau-button icon="lucide:trash-2" variant="danger">
  <strong>Löschen</strong> <small>(irreversibel)</small>
</aufbau-button>
```

## aufbau-code

```html
<!-- 1. Code-Block mit Inline-Text -->
<aufbau-code lang="javascript">
const greet = (name) => `Hello, ${name}!`;
console.log(greet('aufbau'));
</aufbau-code>

<!-- 2. Code-Block via Attribut (ohne Copy-Button) -->
<aufbau-code lang="css" code="body { margin: 0; background: #000; }" no-copy></aufbau-code>

<!-- 3. editierbar: copy, paste und clear im header -->
<aufbau-code lang="json" editable>{ "a": 1 }</aufbau-code>
```

`actions` wählt die buttons (default `copy paste clear`, leer = keine). `paste` und
`clear` wirken nur mit `editable`. paste landet an der cursorposition, beide
gehen über den nativen undo-stack. `no-copy` bleibt als kurzform erhalten.

## aufbau-config

```html
<!-- 1. Central Global Configuration -->
<aufbau-config 
  flag-variant="square" 
  toast-duration="5000" 
  number-unit="px"
  theme="zombie"
></aufbau-config>

<!-- Uses global default ("square") set via <aufbau-config> -->
<aufbau-flag code="de"></aufbau-flag>
<aufbau-flag code="us"></aufbau-flag>

<!-- Local attribute overrides the global default for this specific element -->
<aufbau-flag code="fr" variant="circle"></aufbau-flag>
```

```html
<aufbau-config code-theme="tokyo-night-dark" flag-variant="square"></aufbau-config>

<!-- oder als json body, verschachtelt -->
<aufbau-config>{ "code": { "theme": "nord" }, "toast": { "duration": 5000 } }</aufbau-config>

<!-- oder ausgelagert -->
<aufbau-config src="/aufbau.config.json"></aufbau-config>

<aufbau-code lang="js">const x = 1;</aufbau-code>            <!-- nutzt code-theme -->
<aufbau-code lang="js" theme="github">…</aufbau-code>          <!-- lokaler override -->
```

## aufbau-crumbs

brotkrumen-navigation. der host ist die navigation-landmark, die trenner sind
css (`--crumbs-separator`), die crumbs selbst bleiben normale links und buttons
im light dom. zwei quellen:

```html
<!-- eigene kinder, unangetastet. das letzte bekommt aria-current -->
<aufbau-crumbs>
  <a href="/">Start</a>
  <a href="/docs">Docs</a>
  <span>Elements</span>
</aufbau-crumbs>

<!-- aus einem pfad. ohne href: buttons + event `aufbau-crumbs` { path, index } -->
<aufbau-crumbs path="/home/user/docs" root="Home" max="4"></aufbau-crumbs>

<!-- mit href-vorlage: echte links, {path} wird ersetzt -->
<aufbau-crumbs path="/a/b/c" href="/files?path={path}"></aufbau-crumbs>
```

`max` kürzt die mitte zu einem `…`, das per klick aufklappt. `separator` trennt
den pfad (default `/`).

## aufbau-datalist

```html
<!-- 1. JSONC mit Kommentaren -->
<aufbau-datalist id="cities" src="/data/cities.jsonc" key="name"></aufbau-datalist>

<!-- 2. Lesbares YAML -->
<aufbau-datalist id="tags" src="/config/tags.yaml"></aufbau-datalist>

<!-- 3. Riesen CSV/TSV Tabellen (geparst via PapaParse) -->
<aufbau-datalist id="countries" src="/data/countries.csv" key="CountryName"></aufbau-datalist>

<!-- 4. TOML Config -->
<aufbau-datalist id="presets" src="/settings/presets.toml" key="title"></aufbau-datalist>
```

autonom statt `<datalist is="…">`, safari kennt keine customized built-ins. das
element rendert einen echten `<datalist>` und reicht seine `id` an ihn weiter,
`<input list="cities">` zeigt also weiter auf denselben namen. authored
`<option>`-kinder bleiben erhalten und stehen vor den geladenen.

```html
<!-- Und deine inputs nutzen das einfach nativ -->
<aufbau-input type="text" list="cities" placeholder="Select City..."></aufbau-input>
<aufbau-input type="text" list="countries" placeholder="Select Country..."></aufbau-input>
```

## aufbau-dropdown

```html
<aufbau-dropdown label="Optionen">
  <a href="#edit">Bearbeiten</a>
  <a href="#delete">Löschen</a>
</aufbau-dropdown>
```

## aufbau-flag

```html
<aufbau-flag code="de" variant="circle"></aufbau-flag>
<aufbau-flag code="us"></aufbau-flag>
```

der accessible name ist der ländername in der seitensprache (`de` → „Deutschland“),
`label` überschreibt ihn.

## aufbau-icon

reines css, kein markup. volle iconify-id oder alias, aliases kommen aus
[`@aufbau/icons`](../icons/README.md) (lazy nachgeladen oder per import registriert).

```html
<aufbau-icon icon="lucide:save"></aufbau-icon>
<aufbau-icon icon="save" size="2em" color="tomato"></aufbau-icon>
<aufbau-icon icon="logos:deno" mode="image"></aufbau-icon>   <!-- mehrfarbig -->
<aufbau-icon icon="info" label="Hinweis"></aufbau-icon>      <!-- sonst aria-hidden -->
```

## aufbau-index

layout-container für eine reihe von items — media-grid, gallery-rail oder liste.
reines layout: es rendert nichts eigenes, die children bleiben wie ausgezeichnet.
`viewmode` schaltet über css um, `item-size` / `item-shape` / `gap` sind die
knöpfe. `item-look` ist die kurzform für `item-size` + `item-shape` in einem.

`viewmode`: `grid` (default), `list`, `gallery`, `masonry`.

```html
<!-- Grid view with rounded items -->
<aufbau-index viewmode="grid" item-size="180px" item-shape="rounded" gap="1.5rem">
  <aufbau-item>Standard Item 1</aufbau-item>
  <aufbau-item>Standard Item 2</aufbau-item>
  <!-- Individual child overrides default index shape -->
  <aufbau-item shape="circle">I am a circle!</aufbau-item>
</aufbau-index>

<!-- item-look kurzform: größe + form in einem attribut -->
<aufbau-index viewmode="grid" item-look="180px squircle" gap="1rem">
  <aufbau-item><img src="cover1.jpg" alt="" /></aufbau-item>
  <aufbau-item><img src="cover2.jpg" alt="" /></aufbau-item>
</aufbau-index>

<!-- Vertikale Liste -->
<aufbau-index viewmode="list" gap="0.5rem">
  <aufbau-item>Row 1</aufbau-item>
  <aufbau-item>Row 2</aufbau-item>
</aufbau-index>

<!-- Horizontal Gallery view -->
<aufbau-index viewmode="gallery" item-size="300px" item-shape="squircle">
  <aufbau-item><img src="photo1.jpg" alt="Photo 1" /></aufbau-item>
  <aufbau-item><img src="photo2.jpg" alt="Photo 2" /></aufbau-item>
</aufbau-index>
```

und zusammen mit [`<aufbau-filter>`](#aufbau-filter) wird die suche direkt an
das layout gehängt:

```html
<aufbau-filter target="aufbau-index aufbau-item" placeholder="Search items..."></aufbau-filter>
<aufbau-index viewmode="grid" item-look="200px squircle">
  <aufbau-item>Apple</aufbau-item>
  <aufbau-item>Banana</aufbau-item>
</aufbau-index>
```

### render skipping

`<aufbau-item>` hat `content-visibility: auto`: items ausserhalb des viewports
werden weder gelayoutet noch gezeichnet. damit die scrollhöhe stimmt, braucht ein
übersprungenes item eine ersatzhöhe (`contain-intrinsic-block-size: auto <schätzung>`).
`auto` heisst: einmal gerendert, merkt sich der browser die echte grösse. die
schätzung gilt also nur für items, die noch nie sichtbar waren. quelle, erster treffer gewinnt:

1. `intrinsic-size` am item
2. `item-intrinsic-size` am index
3. gelernt: mittelwert der bisher gerenderten items (masonry, listen, variable höhen)
4. `item-size` als grobe näherung

quadratische items (`shape="circle|square"`) brauchen nichts davon, die höhe
folgt über `aspect-ratio` aus der spaltenbreite. bei wechsel von `viewmode`,
`item-size`, `item-shape` oder `item-look` wird neu gelernt und die gemerkten
grössen verworfen.

`eager` (am index oder item) schaltet das skipping ab. nötig, wenn ein item
bewusst über seinen rand hinaus zeichnet, denn skipping impliziert paint containment.

```html
<aufbau-index viewmode="list" item-intrinsic-size="3.5rem">…</aufbau-index>
<aufbau-index viewmode="masonry">…</aufbau-index>          <!-- lernt selbst -->
<aufbau-item intrinsic-size="480px">großer teaser</aufbau-item>
```

## aufbau-input

`type` ist ausschliesslich der wertetyp, `look` ausschliesslich die darstellung.
für `type="range"` gibt es [`<aufbau-slider>`](#aufbau-slider), für `type="file"`
[`<aufbau-upload>`](#aufbau-upload).

```html
<!-- icon kommt automatisch aus dem typ -->
<aufbau-input name="mail" type="email" placeholder="Enter your email"></aufbau-input>

<!-- stepper statt nacktem zahlenfeld (löst <aufbau-number> ab) -->
<aufbau-input name="size" type="number" look="stepper" min="8" max="64" step="2"></aufbau-input>

<!-- farbfeld -->
<aufbau-input name="brand" type="color" look="swatch" value="#3355ff"></aufbau-input>
```

... with [<aufbau-datalist>](#aufbau-datalist)
```html
<aufbau-input type="text" list="city-list" placeholder="Select City..."></aufbau-input>
```

## aufbau-keyboard

eine bildschirmtastatur — fürs handy und überall da, wo die echte im weg ist.
sie tippt in das, was fokus hat, oder in `target`, indem sie die
keyboard-events schickt, die eine echte taste schicken würde. wo der browser
die VirtualKeyboard-api hat, hält sie die native tastatur unten.

```html
<aufbau-keyboard></aufbau-keyboard>
<aufbau-keyboard layout="en" target="#editor textarea"></aufbau-keyboard>
<aufbau-keyboard rows="keys" native-keyboard="keep"></aufbau-keyboard>
```

`rows` sagt, welche blöcke in welcher reihenfolge gerendert werden
(`"symbols keys"` ist der default). `layout` ist `de` oder `en`, eigene kommen
über `AufbauKeyboard.layouts.fr = { regular, shift, symbols }` dazu: eine reihe
ist ein string aus zeichen, ein leerzeichen darin ist eine lücke.

`shift`, `caps`, `ctrl` und `alt` stehen als attribute am element, sind also
les- und stylebar; shift, ctrl und alt sind einmalig und fallen mit der taste
weg, die sie modifiziert haben. jede taste meldet sich als
`aufbau-keyboard-key`, und `press(key)` / `toggle(name)` gehen auch ohne klick.

zwei dinge, die sie von der vorlage aus `apps/code` unterscheiden: eine taste,
die ein editor selbst behandelt (`preventDefault` auf dem keydown), wird nicht
noch ein zweites mal getippt — und ein blankes `<input>`/`<textarea>` wird
wirklich editiert, weil ein synthetisches KeyboardEvent keine default-action
hat und sonst gar nichts passieren würde.

## aufbau-loop

```html
<!-- 3. Auto-Schaltendes Video-/Image-Carousel (alle 4 Sekunden) -->
<aufbau-loop mode="carousel" interval="4000" pause-on-hover>
  <aufbau-video youtube-id="dQw4w9WgXcQ"></aufbau-video>
  <img src="/assets/slide1.jpg" alt="Slide 1" />
  <img src="/assets/slide2.jpg" alt="Slide 2" />
</aufbau-loop>

<!-- 4. Endloser Marquee-Ticker für Logos -->
<aufbau-loop mode="marquee" speed="15s" pause-on-hover>
  <aufbau-icon icon="logos:preact"></aufbau-icon>
  <aufbau-icon icon="logos:javascript"></aufbau-icon>
  <aufbau-icon icon="logos:css-3"></aufbau-icon>
  <aufbau-icon icon="logos:html-5"></aufbau-icon>
</aufbau-loop>
```

## aufbau-modal

modaler dialog auf einem nativen `<dialog>`: top layer, inerte seite dahinter,
fokus bleibt drin und kehrt danach zurück. der dialog liegt im shadow root, die
kinder bleiben unangetastet und werden per `<slot>` hineinprojiziert. `open`
spiegelt den zustand in beide richtungen, ein `<form method="dialog">` schliesst
ihn und liefert den `returnValue`. styling über `::part(dialog|header|heading|close)`.

```html
<aufbau-modal id="settings" heading="Einstellungen">
  <p>…</p>
  <form method="dialog">
    <button value="cancel">Abbrechen</button>
    <button value="save">Speichern</button>
  </form>
</aufbau-modal>
```

```js
const result = await document.querySelector('#settings').show();   // 'save' | 'cancel' | ''

if (await AufbauModal.confirm('Datei wirklich löschen?', { heading: 'Löschen', confirm: 'Löschen' })) remove();
```

`dismissible` (default an) erlaubt schliessen per button, escape und klick auf
den backdrop. öffnen und schliessen blenden über `@starting-style` und diskrete
transitions von `display`/`overlay`, bei reduzierter bewegung ohne animation.
die seite scrollt nicht, solange ein modal offen ist. grösse über `--modal-size`,
abdunklung über `--modal-backdrop`.

## aufbau-option

datenelement, kein control. es rendert sich nie selbst, sondern wird von seinem
container gelesen — und bleibt dabei im dom, damit optionen zur laufzeit
dazukommen und verschwinden können.

```html
<aufbau-picker name="lang">
  <aufbau-option value="de" icon="circle-flags:de">Deutsch</aufbau-option>
  <aufbau-option value="en" icon="circle-flags:us" selected>English</aufbau-option>
  <aufbau-option value="fr" disabled>Français</aufbau-option>
</aufbau-picker>
```

## aufbau-picker

one-of-n. `look` wechselt nur die darstellung — dieselben optionen funktionieren als
combobox, cycle, radiogruppe oder segmented control.

| look       | verhalten |
| ---------- | --------- |
| `combobox` | der host ist das feld, die optionen stehen in einer popover-liste (default) |
| `cycle`    | ein button mit der aktuellen option. klick nimmt die nächste, langer druck oder rechtsklick öffnet die liste zur direktauswahl. immer einfachauswahl |
| `radio`    | alle optionen inline, untereinander, mit markierung |
| `segments` | alle optionen inline, eine lückenlose reihe |

`icons-only` blendet bei `cycle`, `radio` und `segments` die labels aus, sofern die
option ein icon hat. das label wird dann accessible name und tooltip. die
popover-liste zeigt immer labels.

```html
<aufbau-picker name="view" look="segments" value="month">
  <aufbau-option value="day">Tag</aufbau-option>
  <aufbau-option value="month">Monat</aufbau-option>
  <aufbau-option value="year">Jahr</aufbau-option>
</aufbau-picker>

<!-- durchsuchbar, optionen aus einer datei -->
<aufbau-picker name="framework" look="combobox" searchable
               src="/data/frameworks.yaml" placeholder="Framework wählen..."></aufbau-picker>

<!-- ansicht umschalten: ein button, klick wechselt, langer druck wählt gezielt -->
<aufbau-picker name="layout" look="cycle" icons-only value="grid">
  <aufbau-option value="list" icon="lucide:list">Liste</aufbau-option>
  <aufbau-option value="grid" icon="lucide:layout-grid">Raster</aufbau-option>
</aufbau-picker>

<!-- mehrfachauswahl, ein FormData-eintrag pro wert -->
<aufbau-picker name="tags" look="radio" multiple>
  <aufbau-option value="js">JavaScript</aufbau-option>
  <aufbau-option value="css">CSS</aufbau-option>
</aufbau-picker>
```

## aufbau-progress

```html
<!-- 1. Scroll-Fortschrittsbalken oben an der Seite -->
<aufbau-progress type="scroll" target="body"></aufbau-progress>

<!-- 2. Standard Progress-Bar mit Prozentanzeige -->
<aufbau-progress value="75" max="100" show-text unit="%"></aufbau-progress>
```

## aufbau-reader

lädt prosa. hiess vorher `<aufbau-text>`. markdown läuft für `src` und `raw`
über denselben compiler aus `@aufbau/import`, das element holt sich nichts mehr
selbst von einem cdn.

`src`, `raw` oder die kinder als quelle. die kinder bleiben unangetastet und
werden bei änderung neu gerendert, die ausgabe ist ein `<article>` im light dom.
einrückung aus dem html wird entfernt.

```html
<!-- markdown-datei -->
<aufbau-reader src="/docs/getting-started.md"></aufbau-reader>

<!-- inline markdown -->
<aufbau-reader raw="# Dynamic Title&#10;This is **inline** markdown content."></aufbau-reader>

<!-- oder direkt als kindinhalt -->
<aufbau-reader>
# Titel
Text mit **markdown**.
</aufbau-reader>
```

der ladezustand steht als `:state(loading|ready|error|idle)` am element und ist
damit direkt per css ansprechbar.

## aufbau-skeleton

platzhalter, solange inhalt lädt. nur der host malt, nichts wird gerendert.

```html
<aufbau-skeleton lines="3"></aufbau-skeleton>
<aufbau-skeleton shape="circle" size="3rem"></aufbau-skeleton>
<aufbau-skeleton shape="rect" size="100% 12rem"></aufbau-skeleton>
```

jedes andere aufbau-element kann dasselbe an seiner eigenen stelle: das attribut
`skeleton` (`<aufbau-item skeleton>`), solange die app lädt. reader, table, tree
und picker zeigen ihn von selbst, während sie `src` laden. aussehen über
`--skeleton-color`, `--skeleton-line`, `--skeleton-gap`, `--skeleton-radius`.

## aufbau-slider

ein wert auf einer achse. jeder `type` wird intern auf dieselbe numerische
achse projiziert, deshalb teilen sich zahl, farbe, datum und zeit eine
implementierung.

```html
<aufbau-slider name="delay" type="number" value="300" min="0" max="1000" step="50" unit="ms" controls editable></aufbau-slider>

<!-- zwei griffe, value="from,to" -->
<aufbau-slider name="preis" type="number" range value="20,80" min="0" max="100"></aufbau-slider>

<!-- die achse ist der farbton -->
<aufbau-slider name="hue" type="color" value="#3355ff"></aufbau-slider>

<!-- die achse ist die zeit -->
<aufbau-slider name="von" type="time" value="09:00" min="06:00" max="22:00"></aufbau-slider>
```

## aufbau-table

```html
<!-- 3. Tabelle direkt aus einer CSV-Datei -->
<aufbau-table src="/data/users.csv"></aufbau-table>

<!-- 4. Tabelle aus YAML, beschränkt auf bestimmte Spalten -->
<aufbau-table src="/config/servers.yaml" columns="name, ip, status"></aufbau-table>
```

## aufbau-toc

```html
<div id="layout">
  <!-- Content area that gets mutated by markdown import -->
  <main id="markdown-container">
    <!-- HTML injected via @aufbau/import -->
  </main>

  <!-- Autonomous TOC Component -->
  <aufbau-toc target="#markdown-container" selector="h2, h3" label="Inhalt"></aufbau-toc>
</div>
```

der host ist die navigation-landmark, `label` ist sichtbare überschrift und
accessible name (hiess vorher `title`, das legte einen tooltip über die ganze toc).
jeder eintrag trägt seine ebene als `aria-level`, der eintrag der gerade gelesenen
überschrift bekommt `aria-current="location"`. fehlende ids werden eindeutig vergeben.

## aufbau-toast

meist imperativ über `notify()`. errors werden erkannt, auch als rohes objekt aus
einem `catch`. `dismissible` (default bei `notify()`) erlaubt schliessen per button
und wegwischen per touch. hover und fokus halten den countdown an.

```js
import { notify } from '@aufbau/elements/AufbauToast.js';

notify('Gespeichert');
notify({ success: 'Export fertig', heading: 'Dateien' });
notify({ error: 'Upload fehlgeschlagen' });

try { await save(); }
catch (error) { notify(error); }          // type error, message aus dem error

AufbauToast.error('…');                   // + info, success, warning, warn
notify('Bleibt stehen', { duration: 0 }); // 0 = kein auto-dismiss
```

```html
<aufbau-toast type="warning" heading="Achtung" dismissible>
  Speicher fast voll. <a href="/storage">Aufräumen</a>
</aufbau-toast>
```

## aufbau-toggle

ein boolean. für one-of-n gibt es [`<aufbau-picker>`](#aufbau-picker).

```html
<aufbau-toggle name="darkmode" label="Darkmode aktivieren" checked></aufbau-toggle>
<aufbau-toggle name="agb" look="checkbox" label="AGB akzeptieren" required></aufbau-toggle>
<aufbau-toggle name="pin" look="button" label="Anheften"></aufbau-toggle>
```

## aufbau-tree

```html
<!-- 4. Tree Explorer (Verschachtelt) -->
<aufbau-tree>
  <aufbau-tree-item label="src" expanded>
    <aufbau-tree-item label="components" expanded>
      <aufbau-tree-item label="AufbauElement.js" icon="lucide:file-code"></aufbau-tree-item>
      <aufbau-tree-item label="AufbauTree.js" icon="lucide:file-code"></aufbau-tree-item>
    </aufbau-tree-item>
    <aufbau-tree-item label="index.js" icon="lucide:file-code"></aufbau-tree-item>
  </aufbau-tree-item>
  <aufbau-tree-item label="package.json" icon="lucide:file-json"></aufbau-tree-item>
</aufbau-tree>

<!-- 5. Tree Explorer (Automatisch aus YAML/JSON laden) -->
<aufbau-tree src="/config/file-structure.yaml"></aufbau-tree>
```

tastatur wie beim wai-aria tree view: pfeil hoch/runter wandert durch die
sichtbaren items, rechts öffnet bzw. springt ins erste kind, links schliesst bzw.
springt zum parent, enter wählt und klappt um, leertaste wählt. ein tab-stop für
den ganzen baum.

## aufbau-upload

`accept` statt `mimetype`, weil das native attribut mehr kann: mimetypes
*und* endungen.

```html
<aufbau-upload name="avatar" accept="image/*"></aufbau-upload>
<aufbau-upload name="belege" accept=".pdf,.docx" multiple max-size="5242880"></aufbau-upload>
<aufbau-upload name="logo" look="button" text="Datei wählen"></aufbau-upload>
```

abgelehnte dateien (falscher typ, zu gross) kommen als
`aufbau-upload-rejected`-event und setzen die validity des elements.

## aufbau-value

ein wert, der nur gelesen wird — das `<span class="date">`, das man sich sonst
selbst baut, mitsamt der coercion. `type` ist dasselbe vokabular wie bei den
controls (`core/valueTypes.js`): derselbe wert wird mit `<aufbau-input
type="date">` bearbeitet und mit `<aufbau-value type="date">` angezeigt, und
jeder typ, den die controls lernen, ist einer, den das hier anzeigen kann. das
icon pro typ kommt aus derselben tabelle.

der wert steht im `value`-attribut oder als textinhalt drin (der wird beim mount
ins attribut übernommen). eine blanke zahl ist die numerische form des typs:
millisekunden seit epoch bei `date`/`datetime`, seit mitternacht bei `time` —
nie sekunden.

```html
<aufbau-value type="date">1776643200000</aufbau-value>
<aufbau-value type="date" format="medium" value="2026-04-20"></aufbau-value>
<aufbau-value type="datetime" format="medium" locale="en-GB" value="2026-04-20T14:30"></aufbau-value>
<aufbau-value type="time" icon>14:30</aufbau-value>
<aufbau-value type="url" icon copy>https://example.com</aufbau-value>
```

es formatiert, es erzählt nicht: ein datum ist ein datum, nie »gestern«. die
einzige wahl ist die schreibweise.

`format` ohne angabe ist die maschinenform (`2026-04-20`, `14:30`), lokale
wanduhr und nicht utc. dazu `short` / `medium` / `long` / `full` (Intl) für
`date`, `datetime` und `time`, sowie `locale` für `number`. pro typ auch global
setzbar — attribut schlägt config, typ-key schlägt allgemeinen key:

```html
<aufbau-config value-date-format="medium" value-locale="de-DE"></aufbau-config>
```

`date`, `datetime` und `time` rendern als `<time datetime="…">`, die
maschinenform bleibt also für maschinen erhalten, egal in welcher schreibweise
die seite sie liest. `copy` legt das in die zwischenablage, was auf dem schirm
steht, und meldet es als `aufbau-value-copy`; der wert dahinter ist
`el.machine`.

## aufbau-video

```html
<aufbau-video youtube-id="dQw4w9WgXcQ"></aufbau-video>
```

## aufbau-waveform

```html
<aufbau-waveform src="/media/track.mp3" bars="60" interactive></aufbau-waveform>

<!-- vorberechnete peaks, fortschritt und markierter bereich (trim-editoren) -->
<aufbau-waveform peaks="0.2 0.8 0.5 0.9" progress="40" range-start="20" range-end="60"></aufbau-waveform>
```

keine kinder: der host malt seine farben als hintergrund-ebenen und wird von
einem svg der balken maskiert. ein fortschritts-update ist eine custom property,
die balken werden nur bei neuen peaks neu gezeichnet. farben über
`--waveform-played`, `--waveform-range`, `--waveform-rest`, höhe über
`--waveform-height`. `interactive` macht ihn zum slider (klick, pfeiltasten).

## aufbau-writer

mehrzeiliger text, das gegenstück zu [`<aufbau-reader>`](#aufbau-reader).

```html
<aufbau-writer name="bio" placeholder="Kurz über dich..." counter maxlength="280"></aufbau-writer>

<!-- wächst mit, zwischen 3 und 12 zeilen -->
<aufbau-writer name="notiz" autogrow min-rows="3" max-rows="12"></aufbau-writer>

<!-- kindinhalt ist der startwert -->
<aufbau-writer name="entwurf">Erster Entwurf.</aufbau-writer>

<!-- nur kopieren, keine anderen buttons -->
<aufbau-writer name="log" readonly actions="copy"></aufbau-writer>
```

`actions` wie bei [`<aufbau-code>`](#aufbau-code), default `copy paste clear`.
bei `readonly` sind paste und clear deaktiviert. `:state(full)` markiert einen
counter, der `maxlength` erreicht hat.

---

```html
<!-- Remote data fetch for datalist autocomplete -->
<aufbau-datalist id="city-list" src="/api/cities.json" key="name"></aufbau-datalist>

<!-- Input with preset icon & datalist linkage -->


<!-- Filter search bar connected directly to an aufbau-index layout -->
<aufbau-filter target="aufbau-index aufbau-item" placeholder="Search items..."></aufbau-filter>

<aufbau-index viewmode="grid" item-look="200px squircle">
  <aufbau-item>Apple iPhone 15</aufbau-item>
  <aufbau-item>Samsung Galaxy S24</aufbau-item>
  <aufbau-item>Google Pixel 8</aufbau-item>
</aufbau-index>

<!-- 1. Toast Triggern via JS -->
<button onclick="AufbauToast.notify({ type: 'success', title: 'Gespeichert!', message: 'Daten wurden aktualisiert.' })">
  Toast anzeigen
</button>
```

---

```javascript
// @aufbau/elements/AufbauAudio.js
import { AufbauElement } from './AufbauElement.js';

export default class AufbauAudio extends AufbauElement {
  // Schema definition: Supports type constructors OR default values
  static attr = {
    src: String,          // Type: String, fallback: undefined
    title: 'Untitled',    // Inferred Type: String, fallback: 'Untitled'
    volume: 50,           // Inferred Type: Number, fallback: 50
    autoplay: Boolean,    // Type: Boolean, fallback: false
    loop: false,          // Inferred Type: Boolean, fallback: false
  };

  update () {
    // 1. Destructure everything at once with automatic casting & schema fallbacks!
    const { src, title, volume, autoplay, loop } = this.getAttr();

    console.log({ src, title, volume, autoplay, loop });
  }
}

// Auto-registers as 'aufbau-audio' and extracts observedAttributes from static attr
AufbauAudio.init();
```

```javascript
// inside any method of your component:

// A) single attribute using the static schema
const volume     = this.getAttr('volume');   // returns parsed number (e.g. 80) or default 50
const isAutoplay = this.getAttr('autoplay'); // returns boolean (true/false)

// B) overriding schema type on demand
const volumeString = this.getAttr('volume', String); // Forces returning '80' as String

// C) overriding schema fallback on demand
const customMin = this.getAttr('min', Number, 0); // Forces type Number with fallback 0
```

```javascript
// @aufbau/elements/AufbauDropdown.js
import { AufbauElement } from './AufbauElement.js';

export default class AufbauDropdown extends AufbauElement {
  // Classic array syntax still fully supported
  static attr = ['label', 'open'];

  update () {
    // Destructuring with explicit type override
    const { open } = this.getAttr(Boolean);
    
    // Destructuring default (String)
    const { label } = this.getAttr();
  }
}

AufbauDropdown.init();
```
