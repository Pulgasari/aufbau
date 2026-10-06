# @aufbau/elements

official **aufbau** custom elements: the building blocks and what is composed of
them, in one package. what they build on, the base class, config and skin, is
[`@aufbau/element`](../element/README.md).

| folder           | what it is |
|------------------|------------|
| `webcomponents/` | every element, one file each named like its tag: `btn-icon.js`, `div-x.js`, … the inputs that are a type are all in `input/tags.js` |
| `lib/`           | helpers of the elements: html, actions, locale, options, placement, … |
| `data/`          | the lists the inputs pick from |
| `adapters/`      | htx |

**preview:** [https://code.pulgasari.dev/aufbau/elements/](https://code.pulgasari.dev/aufbau/elements/)

## usage

```js
// lazy: each element is defined the first time its tag shows up
import { autoloader } from '@aufbau/elements';
const stop = autoloader();

// everything at once, for prototyping
import { registerAll } from '@aufbau/elements';
await registerAll();

// hand picked
import '@aufbau/elements/webcomponents/svg-flag.js';
import '@aufbau/elements/webcomponents/input/tags.js';
```

```html
<svg-flag code="de"></svg-flag>
<input-language name="lang" value="de"></input-language>
<write-md name="notes" preview="side"></write-md>
```

the entry is side effect free. the base class and the config come from
`@aufbau/element`:

```js
import { AufbauElement, getConfig, setConfig } from '@aufbau/element';
```

## htx

one adapter for all of them. the `aufbau-*` elements get a `$` shorthand, the
others are real tags already: htx only learns what their positional values fill.

```js
import * as elements from '@aufbau/elements/htx';

html.define(elements);

html`<svg-icon 'lucide:star' />`          // <svg-icon icon="lucide:star">
html`<input-color 'red' name="color" />`   // <input-color value="red" name="color">
html`<embed-youtube 'dQw4w9WgXcQ' />`      // <embed-youtube src="dQw4w9WgXcQ">
```

---

# elements

the building blocks, in families by what they are for: `btn-` buttons, `data-`
collections, `embed-` content of other sites, `media-` files and players, `nav-`
navigation, `output-` values shown, `pop-` everything that opens over the page,
`svg-` icons, `widget-` small tools of their own (keyboard, calculator),
`write-` editors. `mock-` fills a page with placeholders. the controls that hold a value are the input-*
elements below.

`aufbau-loop`, `aufbau-progress` and `aufbau-skeleton` keep their `aufbau-` names
for now: no better name found yet, and not happy with these.

[`<aufbau-loop>`](#aufbau-loop) ·
[`<aufbau-progress>`](#aufbau-progress) ·
[`<aufbau-skeleton>`](#aufbau-skeleton) ·
[`<btn-icon>`](#btn-push-btn-tap-btn-icon) ·
[`<btn-push>`](#btn-push-btn-tap-btn-icon) ·
[`<btn-tap>`](#btn-push-btn-tap-btn-icon) ·
[`<data-index>`](#data-index) ·
[`<data-list>`](#data-list) ·
[`<data-table>`](#data-table) ·
[`<data-tree>`](#data-tree) ·
[`<embed-content>`](#embed-content) ·
[`<input-file>`](#input-file) ·
[`<media-audio>`](#media-audio) ·
[`<media-file>`](#media-file) ·
[`<media-video>`](#media-video) ·
[`<media-wave>`](#media-wave) ·
[`<mock-img>`](#mock-img) ·
[`<mock-p>`](#mock-p) ·
[`<nav-crumbs>`](#nav-crumbs) ·
[`<nav-initials>`](#nav-initials) ·
[`<nav-paginate>`](#nav-paginate) ·
[`<nav-toc>`](#nav-toc) ·
[`<output-md>`](#output-md) ·
[`<output-value>`](#output-value) ·
[`<pop-menu>`](#pop-menu) ·
[`<pop-modal>`](#pop-modal) ·
[`<pop-over>`](#pop-over) ·
[`<pop-prompt>`](#pop-prompt) ·
[`<pop-tip>`](#pop-tip) ·
[`<pop-toast>`](#pop-toast) ·
[`<svg-flag>`](#svg-flag) ·
[`<svg-icon>`](#svg-icon) ·
[`<svg-logo>`](#svg-logo) ·
[`<widget-calculator>`](#widget-calculator) ·
[`<widget-keyboard>`](#widget-keyboard) ·
[`<write-code>`](#write-code) ·
[`<write-text>`](#write-text) ·

## aufbau-loop

```html
<!-- 3. Auto-Schaltendes Video-/Image-Carousel (alle 4 Sekunden) -->
<aufbau-loop mode="carousel" interval="4000" pause-on-hover>
  <media-video youtube-id="dQw4w9WgXcQ"></media-video>
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

## aufbau-progress

```html
<!-- 1. Scroll-Fortschrittsbalken oben an der Seite -->
<aufbau-progress type="scroll" target="body"></aufbau-progress>

<!-- 2. Standard Progress-Bar mit Prozentanzeige -->
<aufbau-progress value="75" max="100" show-text unit="%"></aufbau-progress>
```

## aufbau-skeleton

platzhalter, solange inhalt lädt. nur der host malt, nichts wird gerendert.

```html
<aufbau-skeleton lines="3"></aufbau-skeleton>
<aufbau-skeleton shape="circle" size="3rem"></aufbau-skeleton>
<aufbau-skeleton shape="rect" size="100% 12rem"></aufbau-skeleton>
```

jedes andere element kann dasselbe an seiner eigenen stelle: das attribut
`skeleton` (`<data-item skeleton>`), solange die app lädt. reader, table und
tree zeigen ihn von selbst, während sie `src` laden. hat das element schon
markup, wird jedes blatt davon ein grauer block in seiner eigenen größe; ist es
noch leer, füllen zeilen die box. aussehen über `--skeleton-color`,
`--skeleton-radius`, für die zeilen `--skeleton-line`, `--skeleton-gap`,
`--skeleton-lines`.

## btn-push, btn-tap, btn-icon

three buttons for three roles: `btn-push` is filled and does the main thing,
`btn-tap` stays light (menus, toolbars, secondary actions), `btn-icon` shows
only an icon.

```html
<btn-push icon="save" type="submit">Speichern</btn-push>
<btn-tap>Abbrechen</btn-tap>
<btn-icon icon="lucide:settings" label="Einstellungen"></btn-icon>
```

`command` runs a command on a target, named like the native invoker commands.
the command also brings an icon and a label, so `<btn-icon command="close">`
needs nothing else:

```html
<pop-modal heading="Hallo">
  <btn-icon command="close"></btn-icon>          <!-- the nearest element above with close() -->
</pop-modal>

<btn-tap command="share" commandfor="#post">Teilen</btn-tap>   <!-- an id or a selector -->
<btn-push command="show-modal" commandfor="settings">Öffnen</btn-push>   <!-- a native <dialog> as well -->
```

the command becomes a method (`show-modal` -> `showModal()`, `--my-thing` ->
`myThing()`). a target without that method gets a `command` event. the presets:
`add` `back` `bookmark` `cancel` `close` `collapse` `copy` `cut` `delete` `edit`
`expand` `export` `heart` `import` `menu` `more` `reset` `save` `search` `share`,
more through `Btn.commands`.

## config

defaults for every element of a kind, set from script. every attribute falls
back to the key `tag-attribute`, an attribute on the element wins. the elements
of that tag update when it changes.

```js
import { setConfig } from '@aufbau/element';

setConfig('svg-flag-variant', 'square');
setConfig({ 'write-code': { theme: 'nord' }, 'pop-toast': { duration: 5000 } });
setConfig('output-value-date-format', 'medium');   // the format of one type of <output-value>
```

## data-index

layout-container für eine reihe von items — media-grid, gallery-rail oder liste.
reines layout: es rendert nichts eigenes, die children bleiben wie ausgezeichnet.
`viewmode` schaltet über css um, `item-size` / `item-shape` / `gap` sind die
knöpfe. `item-look` ist die kurzform für `item-size` + `item-shape` in einem.

`viewmode`: `grid` (default), `list`, `gallery`, `masonry`.

```html
<!-- Grid view with rounded items -->
<data-index viewmode="grid" item-size="180px" item-shape="rounded" gap="1.5rem">
  <data-item>Standard Item 1</data-item>
  <data-item>Standard Item 2</data-item>
  <!-- Individual child overrides default index shape -->
  <data-item shape="circle">I am a circle!</data-item>
</data-index>

<!-- item-look kurzform: größe + form in einem attribut -->
<data-index viewmode="grid" item-look="180px squircle" gap="1rem">
  <data-item><img src="cover1.jpg" alt="" /></data-item>
  <data-item><img src="cover2.jpg" alt="" /></data-item>
</data-index>

<!-- Vertikale Liste -->
<data-index viewmode="list" gap="0.5rem">
  <data-item>Row 1</data-item>
  <data-item>Row 2</data-item>
</data-index>

<!-- Horizontal Gallery view -->
<data-index viewmode="gallery" item-size="300px" item-shape="squircle">
  <data-item><img src="photo1.jpg" alt="Photo 1" /></data-item>
  <data-item><img src="photo2.jpg" alt="Photo 2" /></data-item>
</data-index>
```

und zusammen mit [`<data-filter>`](#data-filter) wird die suche direkt an
das layout gehängt:

```html
<data-filter target="data-index data-item" placeholder="Search items..."></data-filter>
<data-index viewmode="grid" item-look="200px squircle">
  <data-item>Apple</data-item>
  <data-item>Banana</data-item>
</data-index>
```

### render skipping

`<data-item>` hat `content-visibility: auto`: items ausserhalb des viewports
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
<data-index viewmode="list" item-intrinsic-size="3.5rem">…</data-index>
<data-index viewmode="masonry">…</data-index>          <!-- lernt selbst -->
<data-item intrinsic-size="480px">großer teaser</data-item>
```

## data-list

```html
<!-- 1. JSONC mit Kommentaren -->
<data-list id="cities" src="/data/cities.jsonc" key="name"></data-list>

<!-- 2. Lesbares YAML -->
<data-list id="tags" src="/config/tags.yaml"></data-list>

<!-- 3. Riesen CSV/TSV Tabellen (geparst via PapaParse) -->
<data-list id="countries" src="/data/countries.csv" key="CountryName"></data-list>

<!-- 4. TOML Config -->
<data-list id="presets" src="/settings/presets.toml" key="title"></data-list>
```

autonom statt `<datalist is="…">`, safari kennt keine customized built-ins. das
element rendert einen echten `<datalist>` und reicht seine `id` an ihn weiter,
`<input list="cities">` zeigt also weiter auf denselben namen. authored
`<option>`-kinder bleiben erhalten und stehen vor den geladenen.

```html
<!-- Und deine inputs nutzen das einfach nativ -->
<input list="cities" placeholder="Select City…">
<input list="countries" placeholder="Select Country…">
```

## data-table

```html
<!-- 3. Tabelle direkt aus einer CSV-Datei -->
<data-table src="/data/users.csv"></data-table>

<!-- 4. Tabelle aus YAML, beschränkt auf bestimmte Spalten -->
<data-table src="/config/servers.yaml" columns="name, ip, status"></data-table>
```

## data-tree

```html
<!-- 4. Tree Explorer (Verschachtelt) -->
<data-tree>
  <data-node label="src" expanded>
    <data-node label="components" expanded>
      <data-node label="AufbauElement.js" icon="lucide:file-code"></data-node>
      <data-node label="DataTree.js" icon="lucide:file-code"></data-node>
    </data-node>
    <data-node label="index.js" icon="lucide:file-code"></data-node>
  </data-node>
  <data-node label="package.json" icon="lucide:file-json"></data-node>
</data-tree>

<!-- 5. Tree Explorer (Automatisch aus YAML/JSON laden) -->
<data-tree src="/config/file-structure.yaml"></data-tree>
```

tastatur wie beim wai-aria tree view: pfeil hoch/runter wandert durch die
sichtbaren items, rechts öffnet bzw. springt ins erste kind, links schliesst bzw.
springt zum parent, enter wählt und klappt um, leertaste wählt. ein tab-stop für
den ganzen baum.

## embed-content

inhalt von dritten (video, song, post) hinter einem klick. bis dahin ist das
element ein lokaler platzhalter, beim anbieter wird nichts angefragt, auch kein
vorschaubild: das einzige bild ist das `poster` der seite selbst.

```html
<embed-content src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></embed-content>
<embed-content src="https://open.spotify.com/album/…" remember></embed-content>
<embed-content src="https://example.com/widget" height="400px" label="Widget"></embed-content>
```

erkannt werden youtube (über youtube-nocookie), vimeo, spotify, soundcloud,
bandcamp (die `EmbeddedPlayer`-url, eine albumseite lässt sich nicht einbetten)
und mastodon-posts. jede andere url wird so eingebettet, wie sie ist. eine url,
die sich nicht einbetten lässt, macht den platzhalter zum link.

| attribut   | |
|---|---|
| `consent`  | `click` (default) oder `auto`, auch über `setConfig('embed-content-consent', 'auto')`, etwa wenn die seite selbst schon gefragt hat |
| `remember` | merkt sich den klick pro anbieter, spätere embeds von ihm laden sofort |
| `ratio`    | z.b. `4 / 3`, sonst das des anbieters |
| `height`   | eine feste höhe statt eines verhältnisses |
| `width`    | eine breite, höchstens die verfügbare |
| `poster`   | ein bild der seite für den platzhalter |
| `label`    | name auf dem platzhalter und des frames |

`activate()` lädt von außen, danach `:state(active)` und das event `activate`
mit `{ provider, src }`. `resolveEmbed(url)` ist exportiert.

## input-file

`accept` statt `mimetype`, weil das native attribut mehr kann: mimetypes
*und* endungen.

```html
<input-file name="avatar" accept="image/*"></input-file>
<input-file name="belege" accept=".pdf,.docx" multiple max-size="5242880"></input-file>
<input-file name="logo" look="button" text="Datei wählen"></input-file>
```

abgelehnte dateien (falscher typ, zu gross) kommen als
`input-file-rejected`-event und setzen die validity des elements.

## media-audio

```html
<media-audio 
  src="/media/track.mp3" 
  label="Cyberpunk Theme" 
  artist="Synthwave Studio" 
  cover="/media/cover.jpg"
  layout="card">
</media-audio>
```

## media-file

ein file, gezeigt von dem, was sein typ verlangt: `media-audio`, `media-video`,
ein bild, ein pdf. alles andere wird ein download-link. `type` (mime) geht vor
der endung.

```html
<media-file src="/files/song.mp3"></media-file>
<media-file src="/files/scan.pdf" label="Rechnung"></media-file>
<media-file src="/api/blob/42" type="image/png"></media-file>
```

## media-video

```html
<media-video youtube-id="dQw4w9WgXcQ"></media-video>
```

## media-wave

```html
<media-wave src="/media/track.mp3" bars="60" interactive></media-wave>

<!-- vorberechnete peaks, fortschritt und markierter bereich (trim-editoren) -->
<media-wave peaks="0.2 0.8 0.5 0.9" progress="40" range-start="20" range-end="60"></media-wave>
```

keine kinder: der host malt seine farben als hintergrund-ebenen und wird von
einem svg der balken maskiert. ein fortschritts-update ist eine custom property,
die balken werden nur bei neuen peaks neu gezeichnet. farben über
`--waveform-played`, `--waveform-range`, `--waveform-rest`, höhe über
`--waveform-height`. `interactive` macht ihn zum slider (klick, pfeiltasten).

## mock-img

ein platzhalter-foto von [picsum.photos](https://picsum.photos). gleicher `seed`,
gleiches foto, ohne `seed` bekommt jedes element ein anderes.

```html
<mock-img width="400" height="300"></mock-img>
<mock-img seed="aufbau" width="160" height="120" grayscale blurred="3"></mock-img>
```

`blurred` statt `blur`: `blur` ist eine methode von `HTMLElement`, renderer wie
htx oder preact setzen es als property statt als attribut.

## mock-p

ein absatz lorem ipsum, lokal erzeugt, ohne api. `seed` hält den text über
ladevorgänge gleich, `classic` beginnt mit „Lorem ipsum dolor sit amet“.

```html
<mock-p></mock-p>                    <!-- 50 wörter -->
<mock-p words="120" seed="intro" classic></mock-p>
```

`lorem({ classic, random, words })` gibt es auch als export von `mock-p.js`.

## nav-crumbs

brotkrumen-navigation. der host ist die navigation-landmark, die trenner sind
css (`--crumbs-separator`), die crumbs selbst bleiben normale links und buttons
im light dom. zwei quellen:

```html
<!-- eigene kinder, unangetastet. das letzte bekommt aria-current -->
<nav-crumbs>
  <a href="/">Start</a>
  <a href="/docs">Docs</a>
  <span>Elements</span>
</nav-crumbs>

<!-- aus einem pfad. ohne href: buttons + event `nav-crumbs` { path, index } -->
<nav-crumbs path="/home/user/docs" root="Home" max="4"></nav-crumbs>

<!-- mit href-vorlage: echte links, {path} wird ersetzt -->
<nav-crumbs path="/a/b/c" href="/files?path={path}"></nav-crumbs>
```

`max` kürzt die mitte zu einem `…`, das per klick aufklappt. `separator` trennt
den pfad (default `/`).

## nav-initials

die anfangsbuchstaben der items in `target`, ein button je buchstabe, der zum
ersten item scrollt und `nav-initials` mit `{ initial, items }` feuert.

```html
<nav-initials target="#contacts" empty></nav-initials>
<ul id="contacts">…</ul>
```

| attribut | |
|---|---|
| `target` | der container |
| `items` | die items darin, default `:scope > *` |
| `text` | selector im item, dessen text zählt, default das item selbst |
| `empty` | auch buchstaben ohne items, disabled |
| `alphabet` | die buchstaben für `empty`, default `A`–`Z` |
| `order` | `asc` (default) oder `desc` |

gruppiert und sortiert wird mit `Intl.Collator` in der sprache des elements
(nächstes `[lang]`, sonst das dokument): auf deutsch geht Ü zu U, auf schwedisch
ist Ö ein eigener buchstabe nach Z. alles ohne buchstaben vorn landet unter `#`.

## nav-paginate

seiten der items in `target`: die items außerhalb der seite bekommen `hidden`.
ohne `target` zeigt es nur `pages` und meldet die gewählte seite, z.b. für
serverseitiges paging.

```html
<nav-paginate target="#results" size="20"></nav-paginate>
<nav-paginate pages="20" page="9"></nav-paginate>
```

`page` ist die aktuelle seite (1-basiert), `size` items pro seite, `around` wie
viele nachbarn um die aktuelle seite stehen (`1 … 8 9 10 … 20`). ein wechsel
setzt `page` und feuert `nav-paginate` mit `{ page, pages }`.

## nav-toc

```html
<div id="layout">
  <!-- Content area that gets mutated by markdown import -->
  <main id="markdown-container">
    <!-- HTML injected via @aufbau/import -->
  </main>

  <!-- Autonomous TOC Component -->
  <nav-toc target="#markdown-container" selector="h2, h3" label="Inhalt"></nav-toc>
</div>
```

der host ist die navigation-landmark, `label` ist sichtbare überschrift und
accessible name (hiess vorher `title`, das legte einen tooltip über die ganze toc).
jeder eintrag trägt seine ebene als `aria-level`, der eintrag der gerade gelesenen
überschrift bekommt `aria-current="location"`. fehlende ids werden eindeutig vergeben.

## output-md

lädt prosa. hiess vorher `<aufbau-text>`. markdown läuft für `src` und `raw`
über denselben compiler aus `@aufbau/import`, das element holt sich nichts mehr
selbst von einem cdn.

`src`, `raw` oder die kinder als quelle. die kinder bleiben unangetastet und
werden bei änderung neu gerendert, die ausgabe ist ein `<article>` im light dom.
einrückung aus dem html wird entfernt.

```html
<!-- markdown-datei -->
<output-md src="/docs/getting-started.md"></output-md>

<!-- inline markdown -->
<output-md raw="# Dynamic Title&#10;This is **inline** markdown content."></output-md>

<!-- oder direkt als kindinhalt -->
<output-md>
# Titel
Text mit **markdown**.
</output-md>
```

der ladezustand steht als `:state(loading|ready|error|idle)` am element und ist
damit direkt per css ansprechbar.

## output-value

ein wert, der nur gelesen wird — das `<span class="date">`, das man sich sonst
selbst baut, mitsamt der coercion. `type` ist dasselbe vokabular wie bei den
inputs (`webcomponents/input/types/`): derselbe wert wird mit `<input-date>`
bearbeitet und mit `<output-value type="date">` angezeigt, und
jeder typ, den die controls lernen, ist einer, den das hier anzeigen kann. das
icon pro typ kommt aus derselben tabelle.

der wert steht im `value`-attribut oder als textinhalt drin (der wird beim mount
ins attribut übernommen). eine blanke zahl ist die numerische form des typs:
millisekunden seit epoch bei `date`/`datetime`, seit mitternacht bei `time` —
nie sekunden.

```html
<output-value type="date">1776643200000</output-value>
<output-value type="date" format="medium" value="2026-04-20"></output-value>
<output-value type="datetime" format="medium" locale="en-GB" value="2026-04-20T14:30"></output-value>
<output-value type="time" icon>14:30</output-value>
<output-value type="url" icon copy>https://example.com</output-value>
```

es formatiert, es erzählt nicht: ein datum ist ein datum, nie »gestern«. die
einzige wahl ist die schreibweise.

`format` ohne angabe ist die maschinenform (`2026-04-20`, `14:30`), lokale
wanduhr und nicht utc. dazu `short` / `medium` / `long` / `full` (Intl) für
`date`, `datetime` und `time`, sowie `locale` für `number`. pro typ auch global
setzbar — attribut schlägt config, typ-key schlägt allgemeinen key:

```js
setConfig({ 'output-value': { 'date-format': 'medium', locale: 'de-DE' } });
```

`date`, `datetime` und `time` rendern als `<time datetime="…">`, die
maschinenform bleibt also für maschinen erhalten, egal in welcher schreibweise
die seite sie liest. `copy` legt das in die zwischenablage, was auf dem schirm
steht, und meldet es als `output-value-copy`; der wert dahinter ist
`el.machine`.

## pop-menu

```html
<pop-menu label="Optionen">
  <a href="#edit">Bearbeiten</a>
  <a href="#delete">Löschen</a>
</pop-menu>
```

## pop-modal

modaler dialog auf einem nativen `<dialog>`: top layer, inerte seite dahinter,
fokus bleibt drin und kehrt danach zurück. der dialog liegt im shadow root, die
kinder bleiben unangetastet und werden per `<slot>` hineinprojiziert. `open`
spiegelt den zustand in beide richtungen, ein `<form method="dialog">` schliesst
ihn und liefert den `returnValue`. styling über `::part(dialog|header|heading|close)`.

```html
<pop-modal id="settings" heading="Einstellungen">
  <p>…</p>
  <form method="dialog">
    <button value="cancel">Abbrechen</button>
    <button value="save">Speichern</button>
  </form>
</pop-modal>
```

```js
const result = await document.querySelector('#settings').show();   // 'save' | 'cancel' | ''
```

`dismissible` (default an) erlaubt schliessen per button, escape und klick auf
den backdrop. öffnen und schliessen blenden über `@starting-style` und diskrete
transitions von `display`/`overlay`, bei reduzierter bewegung ohne animation.
die seite scrollt nicht, solange ein modal offen ist. grösse über `--modal-size`,
abdunklung über `--modal-backdrop`.

## pop-over

beliebiger inhalt über der seite, nicht modal: das element selbst ist ein natives
popover im top layer und schliesst bei klick daneben oder escape. es sitzt am
element, das beim öffnen den fokus hatte, oder an `anchor` (id oder selector).

```html
<btn-tap command="toggle-popover" commandfor="info">Info</btn-tap>
<pop-over id="info" placement="bottom-end">…</pop-over>
```

`show()`, `hide()`, `toggle()`, `open` spiegelt den zustand.

## pop-prompt

eine frage in einem `pop-modal`: nachricht, vielleicht ein feld, abbrechen und
bestätigen. das feld ist ein `input-value` jeden typs, mit `look` und optionen.
enter im feld bestätigt.

```js
if (await PopPrompt.confirm('Datei wirklich löschen?', { heading: 'Löschen', confirm: 'Löschen' })) remove();

const name = await PopPrompt.prompt('Wie soll die datei heissen?', 'unbenannt');   // null bei abbrechen
const day  = await PopPrompt.prompt('Wann?', '', { field: 'date' });
const lang = await PopPrompt.prompt('Sprache?', 'de', { field: 'language' });
const size = await PopPrompt.prompt('Größe?', 'm', { options: ['s', 'm', { value: 'l', label: 'groß' }], look: 'segments' });
await PopPrompt.alert('Gespeichert.');
```

```html
<pop-prompt heading="Löschen" message="Wirklich löschen?" confirm="Löschen" cancel="Behalten"></pop-prompt>
```

## pop-tip

ein hinweis zu einem anderen element, solange es gehovert oder fokussiert ist.
ohne `for` das element davor. setzt `aria-describedby` am ziel.

```html
<btn-icon command="save" id="save"></btn-icon>
<pop-tip for="save">Speichern (strg+s)</pop-tip>
```

## pop-toast

meist imperativ über `notify()`. errors werden erkannt, auch als rohes objekt aus
einem `catch`. `dismissible` (default bei `notify()`) erlaubt schliessen per button
und wegwischen per touch. hover und fokus halten den countdown an.

```js
import { notify } from '@aufbau/elements/webcomponents/pop-toast.js';

notify('Gespeichert');
notify({ success: 'Export fertig', heading: 'Dateien' });
notify({ error: 'Upload fehlgeschlagen' });

try { await save(); }
catch (error) { notify(error); }          // type error, message aus dem error

PopToast.error('…');                   // + info, success, warning, warn
notify('Bleibt stehen', { duration: 0 }); // 0 = kein auto-dismiss
```

```html
<pop-toast type="warning" heading="Achtung" dismissible>
  Speicher fast voll. <a href="/storage">Aufräumen</a>
</pop-toast>
```

## svg-flag

```html
<svg-flag code="de" variant="circle"></svg-flag>
<svg-flag code="us"></svg-flag>
```

der accessible name ist der ländername in der seitensprache (`de` → „Deutschland“),
`label` überschreibt ihn.

## svg-icon

reines css, kein markup. volle iconify-id oder alias, aliases kommen aus
[`@aufbau/svg`](../svg/README.md) (lazy nachgeladen oder per import registriert).
das präfix `aufbau` nimmt die dateien aus `@aufbau/svg/icons/` statt iconify.

```html
<svg-icon icon="lucide:save"></svg-icon>
<svg-icon icon="aufbau:aufbau"></svg-icon>             <!-- @aufbau/svg/icons/aufbau.svg -->
<svg-icon icon="save" size="2em" color="tomato"></svg-icon>
<svg-icon icon="logos:deno" mode="image"></svg-icon>   <!-- mehrfarbig -->
<svg-icon icon="info" label="Hinweis"></svg-icon>      <!-- sonst aria-hidden -->
```

## svg-logo

ein logo aus `@aufbau/svg/logos/`, vorerst nur monochrom in `currentColor` wie
`<svg-icon>` (die datei ist die maske). ein verstecktes `<img>` der datei gibt die
breite zur höhe, `size` setzt die höhe.

```html
<svg-logo logo="zugriff"></svg-logo>
<svg-logo logo="aufbau" size="3rem" color="tomato" label="aufbau"></svg-logo>   <!-- sonst aria-hidden -->
```

## widget-calculator

ein taschenrechner als eingabe für eine zahl. der ausdruck steht im display und
lässt sich frei bearbeiten, `✓` rechnet ihn aus und meldet das ergebnis.

```html
<widget-calculator value="125"></widget-calculator>
<input-number actions="calculator"></input-number>   <!-- öffnet ihn im popover -->
```

- `+ − × ÷`, klammern, `%` wie am handy: `200 + 10%` ist 220, `200 × 10%` ist 20
- `( )` setzt die klammer, die gerade passt. offene klammern am ende schließen sich
- das dezimalzeichen kommt aus der sprache des elements (`,` auf deutsch)
- kopfzeile: schließen, kopieren, einfügen, zurücksetzen, systemtastatur
- `α` tauscht die tasten gegen `<widget-keyboard>`
- gerechnet wird mit einem kleinen parser, ohne `eval`. `calculate(text)` gibt es
  auch als export, `null` für einen ungültigen ausdruck

events: `widget-calculator` mit `{ action: 'done', value }` bei `✓` oder enter,
`{ action: 'close' }` beim schließen oder escape.

## widget-keyboard

eine bildschirmtastatur — fürs handy und überall da, wo die echte im weg ist.
sie tippt in das, was fokus hat, oder in `target`, indem sie die
keyboard-events schickt, die eine echte taste schicken würde. wo der browser
die VirtualKeyboard-api hat, hält sie die native tastatur unten.

```html
<widget-keyboard></widget-keyboard>
<widget-keyboard layout="en" target="#editor textarea"></widget-keyboard>
<widget-keyboard rows="keys" native-keyboard="keep"></widget-keyboard>
```

`rows` sagt, welche blöcke in welcher reihenfolge gerendert werden
(`"symbols keys"` ist der default). `layout` ist `de` oder `en`, eigene kommen
über `WidgetKeyboard.layouts.fr = { regular, shift, symbols }` dazu: eine reihe
ist ein string aus zeichen, ein leerzeichen darin ist eine lücke.

`shift`, `caps`, `ctrl` und `alt` stehen als attribute am element, sind also
les- und stylebar; shift, ctrl und alt sind einmalig und fallen mit der taste
weg, die sie modifiziert haben. jede taste meldet sich als
`widget-keyboard-key`, und `press(key)` / `toggle(name)` gehen auch ohne klick.

zwei dinge, die sie von der vorlage aus `apps/code` unterscheiden: eine taste,
die ein editor selbst behandelt (`preventDefault` auf dem keydown), wird nicht
noch ein zweites mal getippt — und ein blankes `<input>`/`<textarea>` wird
wirklich editiert, weil ein synthetisches KeyboardEvent keine default-action
hat und sonst gar nichts passieren würde.

## write-code

```html
<!-- 1. Code-Block mit Inline-Text -->
<write-code lang="javascript">
const greet = (name) => `Hello, ${name}!`;
console.log(greet('aufbau'));
</write-code>

<!-- 2. Code-Block via Attribut (ohne Copy-Button) -->
<write-code lang="css" code="body { margin: 0; background: #000; }" no-copy></write-code>

<!-- 3. editierbar: copy, paste und clear im header -->
<write-code lang="json" editable>{ "a": 1 }</write-code>
```

`actions` wählt die buttons (default `copy paste clear`, leer = keine). `paste` und
`clear` wirken nur mit `editable`. paste landet an der cursorposition, beide
gehen über den nativen undo-stack. `no-copy` bleibt als kurzform erhalten.

## write-text

mehrzeiliger text, das gegenstück zu [`<output-md>`](#output-md).

```html
<write-text name="bio" placeholder="Kurz über dich..." counter maxlength="280"></write-text>

<!-- wächst mit, zwischen 3 und 12 zeilen -->
<write-text name="notiz" autogrow min-rows="3" max-rows="12"></write-text>

<!-- kindinhalt ist der startwert -->
<write-text name="entwurf">Erster Entwurf.</write-text>

<!-- nur kopieren, keine anderen buttons -->
<write-text name="log" readonly actions="copy"></write-text>
```

`actions` wie bei [`<write-code>`](#write-code), default `copy paste clear`.
bei `readonly` sind paste und clear deaktiviert. `:state(full)` markiert einen
counter, der `maxlength` erreicht hat.

---

# input-*

every value a form can hold, one element per kind of value. four questions,
each answered in one place:

| question  | answered by | values |
|-----------|-------------|--------|
| what      | the tag, or `type` on `<input-value>` | `number`, `date`, `color`, `language`, `bool`, … |
| how many  | `range`, `multiple` | one value, two (`from..to`), any number (`a,b,c`) |
| from      | option children, `src`, or a list type | free or from a list |
| how       | `look` | `field`, `stepper`, `slider`, `segments`, `switch`, … |

```html
<input-number name="count" look="stepper" min="0" max="10"></input-number>
<input-number name="price" range look="slider" max="500"></input-number>
<input-date   name="trip"  range></input-date>
<input-text   name="tags"  multiple></input-text>
<input-bool   name="dark"  checked label="dark mode"></input-bool>
<input-language name="lang" languages="de en fr" look="segments"></input-language>

<input-value name="viewmode" look="cycle">
  <input-option value="grid" icon="lucide:grid-2x2">grid</input-option>
  <input-option value="list" icon="lucide:list">list</input-option>
</input-value>
```

the presets (`input-number`, `input-language`, …) are `<input-value>` with a
fixed type, `<input-number>` is `<input-value type="number">`.

## how it is built

everything of the inputs is in `webcomponents/input/`, one file per thing, named like it:

```
webcomponents/input/
  Input.js       the base: value, form, drawing the look
  tags.js        every input-* that is a type: <input-number> is <input-value type="number">
  values.js      one string, two (range) or many (multiple)
  options.js     where options come from: children, src, the list type
  types/         what a value is, one file per type (number.js, language.js, …)
  looks/         how it is entered, one file per look (slider.js, segments.js, …)
    parts/       what several looks share: the field, the options, the popover, the toggle
```

- **one element, one control.** `Input.js` is form associated: FormData,
  validity, reset, `persist`, `disabled` from a fieldset. no inner element
  holds the value, nothing is forwarded.
- **the value is a string with a fixed format**, the same in the attribute, in
  `value` and in FormData. `range` joins with `..`, `multiple` with `,` and
  submits one entry per value. `typedValue` is the value in its type: a number,
  epoch ms, an array for range and multiple.
- **a type is a plain object** (`types/`): parse, format, its default look and
  icon, an `axis` for steppers and sliders, a `list` for values from a list.
- **a look is a plain object** (`looks/`): render, events, update, css. it reads
  top to bottom and changes the value only through the methods of `Input.js`:
  `setPart`, `setNumber`, `step`, `select`, `cycle`, `add`, `removeAt`, `toggle`.
  its stylesheet is adopted only while it is drawn, so its css needs no prefix.
  switching `look` at runtime redraws, the value stays.
- **the type decides which looks fit.** a look that does not fit the value is
  not drawn, the type's own default is. the drawn look is written onto the host
  where the author gave none, so `[look="slider"]` always matches.

| look       | fits                                  | parts |
|------------|---------------------------------------|-------|
| `field`    | one free value                        | icon, input, action |
| `fields`   | two free values (`range`)             | icon, input, separator |
| `stepper`  | one value of a steppable type         | button (decrement, increment), input |
| `swatch`   | one color                             | swatch, input |
| `slider`   | one or two values of an axis type     | track, fill, thumb, input, output, unit |
| `chips`    | any number of free values             | chip, label, remove, input |
| `combobox` | one or more from a list               | icon, input, caret, listbox, option, label |
| `cycle`    | one from a list                       | button, icon, label, listbox, option |
| `radio`    | one or more from a list               | option, mark, icon, label |
| `segments` | one or more from a list               | segment, icon, label |
| `switch`   | a bool                                | control, track, thumb, label |
| `checkbox` | a bool                                | control, check, mark, label |
| `button`   | a bool                                | control, icon, label |

the frame of every look is the part `box`, never the host: page css such as a
reset with `* { padding: 0 }` beats every `:host` rule.

```css
input-number::part(input)    {}
[look="slider"]::part(thumb) {}   /* every slider, whatever its type */
input-value::part(selected)  {}   /* the selected option or segment */
```

| element          | value                               | default look |
|------------------|-------------------------------------|--------------|
| `input-value`    | any, by `type`                      | by type      |
| `input-bool`     | `true`, nothing submitted when off  | switch       |
| `input-chips`    | `red,green`, `input-text multiple`  | chips        |
| `input-color`    | `#ff8800`                           | swatch       |
| `input-country`  | iso 3166-1: `DE`                    | combobox     |
| `input-currency` | iso 4217: `EUR`                     | combobox     |
| `input-date`     | `2026-09-30`                        | field        |
| `input-datetime` | `2026-09-30T14:30`                  | field        |
| `input-duration` | `2s`, `150ms`                       | field        |
| `input-email`    | an address                          | field        |
| `input-font`     | webfonts id: `manrope`              | combobox     |
| `input-hotkey`   | `Ctrl+Shift+K`, recorded            | field        |
| `input-language` | bcp 47: `de`, `pt-BR`               | combobox     |
| `input-locale`   | bcp 47 with region: `de-AT`         | combobox     |
| `input-number`   | a number                            | field        |
| `input-password` | a password, `reveal` shows it       | field        |
| `input-phone`    | a phone number                      | field        |
| `input-search`   | a query, `search` event debounced   | field        |
| `input-slug`     | `ueber-uns`, follows `source`       | field        |
| `input-text`     | a line of text                      | field        |
| `input-time`     | `14:30`                             | field        |
| `input-timezone` | iana: `Europe/Berlin`               | combobox     |
| `input-unit`     | `kilometer`                         | combobox     |
| `input-url`      | `https://…`, scheme added           | field        |
| `input-year`     | `2026`                              | stepper      |

the list types (`input/types/`) take their own attributes: `countries`,
`currencies`, `categories`, `languages`, `locales`, `zones`, `units`, and
`flags="false"`, `native="false"`. their names are in the language of the
nearest `[lang]`, then the document, then the browser.

still composed of the `aufbau-*` elements, to be moved onto `InputValue`:
`input-emoji`, `input-icon` (a search and the hits), `input-pattern`.

---

# app-*, div-*, embed-*, write-*

composed of the `aufbau-*` elements, in the light dom: the skin is adopted by
the document and selects the elements by tag.

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
  an `pop-modal` closed. `controls="close expand"` names the buttons there
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
`<embed-content>` (no request to the provider before the click, `consent`,
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


## notes for later

- more looks: a calendar for date, swatches for color.
- @aufbau/gui (and so `app-config`) still renders the aufbau-* controls of
  @aufbau/elements.
- `input-emoji` knows single code points only (1150), no zwj sequences, skin
  tones or flags. the names are english unicode names, not the cldr keywords.
- `input-phone` could take an `input-country` for the prefix.
- the list types do not follow a change of `[lang]` above them until one
  of their own attributes changes.
- candidates for elements rather than components: `<embed-content>` (a click to
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
<pop-modal>
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
