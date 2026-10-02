# @aufbau/elements2

official **aufbau** custom elements: the building blocks and what is composed of
them, in one package.

| folder      | tags              | what it is |
|-------------|-------------------|------------|
| `aufbau/`   | `aufbau-*`        | the building blocks: a picker, a writer, an input. shadow dom, one file each (`Aufbau<Name>.js`) |
| `app/`      | `app-*`           | the frame of an app: root, views, areas, panels |
| `div/`      | `div-x`, `div-y`  | flex rows and columns |
| `embed/`    | `embed-*`         | click to load embeds of youtube, bandcamp, … |
| `input/`    | `input-*`         | one form control per value domain |
| `svg/`      | `svg-*`           | icons and flags: a box painted by an svg |
| `write/`    | `write-*`         | editors |
| `core/`     |                   | the base classes, the config, the skin, the helpers |
| `data/`     |                   | the lists the inputs pick from |
| `adapters/` |                   | htx |

every tag maps onto its module: `aufbau-<name>` onto `./aufbau/Aufbau<Name>.js`,
`<group>-<name>` onto `./<group>/<name>.js`. the tags are fixed, there is no
renaming.

**preview:** [https://code.pulgasari.dev/aufbau/elements/](https://code.pulgasari.dev/aufbau/elements/)

## usage

```js
// lazy: each element is defined the first time its tag shows up
import { autoloader } from '@aufbau/elements2';
const stop = autoloader();

// everything at once, for prototyping
import { registerAll } from '@aufbau/elements2';
await registerAll();

// hand picked
import '@aufbau/elements2/svg/flag.js';
import '@aufbau/elements2/input/language.js';
```

```html
<svg-flag code="de"></svg-flag>
<input-language name="lang" value="de"></input-language>
<write-md name="notes" preview="side"></write-md>
```

the entry is side effect free and does not re-export the core. the base classes
and the config come from their subpaths:

```js
import { AufbauElement }        from '@aufbau/elements2/core/index.js';
import { setConfig, getConfig } from '@aufbau/elements2/core/AufbauConfig.js';
```

## htx

one adapter for all of them. the `aufbau-*` elements get a `$` shorthand, the
others are real tags already: htx only learns what their positional values fill.

```js
import * as elements from '@aufbau/elements2/htx';

html.define(elements);

html`<svg-icon 'lucide:star' />`          // <svg-icon icon="lucide:star">
html`<input-color 'red' name="color" />`   // <input-color value="red" name="color">
html`<embed-youtube 'dQw4w9WgXcQ' />`      // <embed-youtube src="dQw4w9WgXcQ">
```

---

# aufbau-*

die control-elemente folgen drei achsen: `type` (welcher wert), `look` (wie es
aussieht) und `range`/`multiple` (wie viele). ausführlich in
[CONTROLS.md](./CONTROLS.md), die css-konfiguration in [CSS-CONFIG.md](./CSS-CONFIG.md).

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

[`<aufbau-audio>`](#aufbau-audio) ·
[`<aufbau-button>`](#aufbau-button) ·
[`<aufbau-code>`](#aufbau-code) ·
[`<aufbau-config>`](#aufbau-config) ·
[`<aufbau-crumbs>`](#aufbau-crumbs) ·
[`<aufbau-datalist>`](#aufbau-datalist) ·
[`<aufbau-dropdown>`](#aufbau-dropdown) ·
[`<aufbau-embed>`](#aufbau-embed) ·
[`<aufbau-filter>`](#aufbau-filter) ·
[`<svg-flag>`](#svg-flag) ·
[`<svg-icon>`](#svg-icon) ·
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
<svg-flag code="de"></svg-flag>
<svg-flag code="us"></svg-flag>

<!-- Local attribute overrides the global default for this specific element -->
<svg-flag code="fr" variant="circle"></svg-flag>
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

## aufbau-embed

inhalt von dritten (video, song, post) hinter einem klick. bis dahin ist das
element ein lokaler platzhalter, beim anbieter wird nichts angefragt, auch kein
vorschaubild: das einzige bild ist das `poster` der seite selbst.

```html
<aufbau-embed src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></aufbau-embed>
<aufbau-embed src="https://open.spotify.com/album/…" remember></aufbau-embed>
<aufbau-embed src="https://example.com/widget" height="400px" label="Widget"></aufbau-embed>
```

erkannt werden youtube (über youtube-nocookie), vimeo, spotify, soundcloud,
bandcamp (die `EmbeddedPlayer`-url, eine albumseite lässt sich nicht einbetten)
und mastodon-posts. jede andere url wird so eingebettet, wie sie ist. eine url,
die sich nicht einbetten lässt, macht den platzhalter zum link.

| attribut   | |
|---|---|
| `consent`  | `click` (default) oder `auto`, auch über `<aufbau-config embed-consent="auto">`, etwa wenn die seite selbst schon gefragt hat |
| `remember` | merkt sich den klick pro anbieter, spätere embeds von ihm laden sofort |
| `ratio`    | z.b. `4 / 3`, sonst das des anbieters |
| `height`   | eine feste höhe statt eines verhältnisses |
| `width`    | eine breite, höchstens die verfügbare |
| `poster`   | ein bild der seite für den platzhalter |
| `label`    | name auf dem platzhalter und des frames |

`activate()` lädt von außen, danach `:state(active)` und das event `activate`
mit `{ provider, src }`. `resolveEmbed(url)` ist exportiert.

## svg-flag

```html
<svg-flag code="de" variant="circle"></svg-flag>
<svg-flag code="us"></svg-flag>
```

der accessible name ist der ländername in der seitensprache (`de` → „Deutschland“),
`label` überschreibt ihn.

## svg-icon

reines css, kein markup. volle iconify-id oder alias, aliases kommen aus
[`@aufbau/icons`](../icons/README.md) (lazy nachgeladen oder per import registriert).

```html
<svg-icon icon="lucide:save"></svg-icon>
<svg-icon icon="save" size="2em" color="tomato"></svg-icon>
<svg-icon icon="logos:deno" mode="image"></svg-icon>   <!-- mehrfarbig -->
<svg-icon icon="info" label="Hinweis"></svg-icon>      <!-- sonst aria-hidden -->
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
  <svg-icon icon="logos:preact"></svg-icon>
  <svg-icon icon="logos:javascript"></svg-icon>
  <svg-icon icon="logos:css-3"></svg-icon>
  <svg-icon icon="logos:html-5"></svg-icon>
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

`stepper` setzt einen button davor und einen dahinter, die zur vorherigen und
nächsten option schalten, an beiden enden rundherum. bei jedem look, nie mit
`multiple`. parts: `step` mit `previous` bzw. `next`.

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

<!-- mit buttons zum durchschalten davor und danach -->
<aufbau-picker name="month" look="combobox" stepper value="9">
  <aufbau-option value="8">August</aufbau-option>
  <aufbau-option value="9">September</aufbau-option>
  <aufbau-option value="10">Oktober</aufbau-option>
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
import { notify } from '@aufbau/elements2/aufbau/AufbauToast.js';

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

# app-*, div-*, embed-*, input-*, write-*

composed of the `aufbau-*` elements. those are the primitives, these bring the
domain: a data source, a fixed value format, the language they are shown in.

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
- listeners on the inner elements go into `bind()`. it runs after the first
  render and again on every reconnect, a disconnect releases them.

three bases in `core/`: `InputComponent` (one `aufbau-input` of a type),
`OptionsComponent` (an `aufbau-picker` with options built from data, rebuilt
when they or the language change), `SearchComponent` (a search field and the
hits as a wrapping row).

| component        | value                              | built on / source                          |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `input-bool`     | `value` or `on` when checked       | `aufbau-toggle`                            |
| `input-chips`    | `red,green` (`separator`)          | `aufbau-input`, chips as `aufbau-button`   |
| `input-color`    | `#ff8800`                          | `aufbau-input type=color`, swatch          |
| `input-country`  | iso 3166-1: `DE`                   | `Intl.DisplayNames`, circle-flags          |
| `input-currency` | iso 4217: `EUR`                    | `Intl.supportedValuesOf`                   |
| `input-date`     | `2026-09-30`                       | `aufbau-input type=date`                   |
| `input-email`    | an address                         | `aufbau-input type=email`                  |
| `input-emoji`    | the character: `😀`                | search over the unicode names              |
| `input-font`     | webfonts id: `manrope`             | `@aufbau/webfonts`                         |
| `input-hotkey`   | `Ctrl+Shift+K`                     | recorded from the keyboard                 |
| `input-icon`     | iconify id: `bx:search`            | iconify search api                         |
| `input-item`     | one of the options (`multiple`)    | `aufbau-picker`, children or `src`         |
| `input-language` | bcp 47: `de`, `pt-BR`              | iso 639-1, `Intl.DisplayNames`             |
| `input-locale`   | bcp 47 with region: `de-AT`        | a working set, `Intl.DisplayNames`         |
| `input-number`   | a number                           | `aufbau-input type=number`                 |
| `input-password` | a password                         | `aufbau-input`, a toggle to show it        |
| `input-pattern`  | `dots 8%` (`opacity`, `colors`)    | `@aufbau/patterns`, masked swatches        |
| `input-phone`    | a phone number                     | `aufbau-input type=phone`                  |
| `input-search`   | a query, `search` event debounced  | `aufbau-input`                             |
| `input-slug`     | `ueber-uns`, follows `source`      | `aufbau-input`                             |
| `input-text`     | a line of text                     | `aufbau-input`                             |
| `input-time`     | `14:30`                            | `aufbau-input type=time`                   |
| `input-timezone` | iana: `Europe/Berlin`              | `Intl.supportedValuesOf`                   |
| `input-unit`     | `kilometer`                        | `Intl.supportedValuesOf`                   |
| `input-url`      | `https://…`, scheme added          | `aufbau-input type=url`                    |
| `input-year`     | `2026`                             | `aufbau-input type=year`, stepper          |
| `write-md`       | markdown                           | `aufbau-writer`, `aufbau-reader`           |

### app

the frame of an app: `app-root` holds areas and views and sets the look below
it, `app-area` is a region of it, `app-view` one screen. `app-panel`,
`app-config` and `app-float` are what goes into them.

```html
<app-root palette="zombie" scheme="dark" density="touch" skin="monochrome" loading>
  <app-area name="main">
    <app-view name="library" route="/" active>…</app-view>
    <app-view name="reader" route="/reader" transition-on="slide">…</app-view>
    <app-float anchor="bottom-end">…</app-float>
  </app-area>
  <app-area name="menu" dock="start"><app-panel heading="Menu">…</app-panel></app-area>
  <app-area name="config" dock="end"><app-panel heading="Settings"><app-config></app-config></app-panel></app-area>
  <app-area name="context" dock="bottom" peek>…</app-area>
</app-root>
```

- `app-root`: palette, scheme, density and geometry hold for everything below
  it (data-* on it). the skin is the document's: `skin` sets it on `<html>` and
  swaps the elements' skin. every attribute is a property too, `root.palette =
  'oled'`. `loading` shows a screen until `ready()` (the palette's background
  and a spinner, or a child with `[data-loading]`). `routing="hash | path |
  none"`, `transition` is the default view transition. `show(name)`,
  `area(name)`, event `navigate`. with areas it is a grid: the main one in the
  middle, the docked ones at start, end and bottom. views without areas work as
  before.
- `app-area`: `name` says what it is, `dock="start | end | bottom"` where it
  sits; without dock it is the main area, which holds the views. a docked area
  is a sidebar or a sheet on wide screens and a drawer below `breakpoint`
  (48rem), `overlay="always | never"` forces either. `open`, `expanded` (wider
  or taller, full screen as a drawer), `peek` (a closed bottom drawer keeps its
  handle on screen). the handle drags and taps it open and shut, up again
  expands; escape and the scrim close a drawer and the rest of the app is inert
  meanwhile. no swipe from the screen edge: android takes those for back and
  home. `show()`, `hide()`, `toggle()`, `expand()`, event `toggle`, state
  `:state(overlay)`. its chrome (scrim, handle) is in a shadow root, the
  children stay the author's.
- `app-view`: one of the views of a parent is active, the others are `inert`
  and `content-visibility: hidden`, so their dom, form values and scroll stay.
  `activate()` or setting `active` switches inside a view transition,
  `transition-on` / `transition-off` name a one-way keyframe (fade, slide, zoom,
  pop, rotate-in) or none. `lazy` renders the `<template>` child on the first
  activation, `route` puts the view into the address. events `activate`,
  `deactivate`.
- `app-panel`: a header with `heading`, slots `start` and `actions`, and the
  buttons to close and expand what it sits in: an area is hidden or expanded,
  an `aufbau-modal` closed. `controls="close expand"` names the buttons there
  may be; they only show where they can act.
- `app-config`: a settings form from an `@aufbau/gui` spec. `spec` and `values`
  are properties, event `config { key, values }`. content only, the frame is
  the app's.
- `app-float`: floats over its positioned ancestor (an area or a view) on one
  of nine anchors (`top-start` … `bottom-end`), its children stack in
  `direction="up | down | start | end"`.

### div

`div-x` is a row, `div-y` a column: flex containers along their axis.
`scrollable` lets them scroll along it instead of growing.

```html
<div-y>
  <div-x scrollable>…</div-x>
</div-y>
```

### embed

third party content behind a click, one component per provider over
`<aufbau-embed>` (no request to the provider before the click, `consent`,
`remember`, `height`, `width`, `ratio`, `poster`, `label` as there).

| component          | src                                                       |
| ------------------ | --------------------------------------------------------- |
| `embed-youtube`    | url or video id, `start="1m30s"`                          |
| `embed-vimeo`      | url or video id                                           |
| `embed-spotify`    | url, `spotify:` uri, or id with `type="track"` (default)  |
| `embed-soundcloud` | url                                                       |
| `embed-mastodon`   | post url                                                  |
| `embed-bandcamp`   | id, player url or the whole embed snippet                 |

`embed-bandcamp` takes `type="release | track"` and the styles of bandcamp's
embed dialog as `look`: `slim`, `slim-plain`, `standard`, `standard-short`,
`artwork`, `wide`. its colors follow the palette (`--color-bg`, `--color-ink`),
`bgcol` and `linkcol` override them. the id is not in the page urls, it comes
from bandcamp's own embed code; a page url turns the placeholder into a link.

```html
<embed-youtube src="dQw4w9WgXcQ"></embed-youtube>
<embed-bandcamp src="3119776030" look="slim"></embed-bandcamp>
```

the list components (country, currency, font, item, language, locale,
timezone, unit) take the looks of `aufbau-picker`: `look="combobox | cycle |
radio | segments"`, plus `searchable` and `stepper`.

the language a component shows its names in is the nearest `[lang]`, then the
document, then the browser.


## notes for later

- one `input-*` per value domain. where a domain could be typed or picked
  (date, color, year, time) the typed field is what there is for now, a picker
  look (calendar, swatches) would come as `look`.
- `input-icon` and `input-emoji` show the hits as a wrapping segments row. a
  grid look for `<aufbau-picker>` would suit them better, that is a change in
  the elements.
- `input-emoji` knows single code points only (1150), no zwj sequences, skin
  tones or flags. the names are english unicode names, not the cldr keywords.
- `input-phone` could take an `input-country` for the prefix.
- the list components do not follow a change of `[lang]` above them until one
  of their own attributes changes.
- candidates for elements rather than components: `<aufbau-embed>` (a click to
  load facade for youtube, bandcamp, …) and `<aufbau-indicator type="error |
  loading | success | empty">`.

## ideas for more aufbau-* elements

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
