# @aufbau/elements

official **aufbau** *webcomponents\** library.

\* we don't like that begriff and prefer *"(custom) elements"*.

---

**jump to:**
[usage](#usage)
[config](#config)
[elements](#elements)

[https://pulgasari.github.io/aufbau/elements/](https://pulgasari.github.io/aufbau/elements/)

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
<aufbau-keyboard>
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
[`<aufbau-datalist>`](#aufbau-datalist) ·
[`<aufbau-dropdown>`](#aufbau-dropdown) ·
[`<aufbau-filter>`](#aufbau-filter) ·
[`<aufbau-flag>`](#aufbau-flag) ·
[`<aufbau-icon>`](#aufbau-icon) ·
[`<aufbau-input>`](#aufbau-input) ·
[`<aufbau-loop>`](#aufbau-loop) ·
[`<aufbau-option>`](#aufbau-option) ·
[`<aufbau-picker>`](#aufbau-picker) ·
[`<aufbau-progress>`](#aufbau-progress) ·
[`<aufbau-reader>`](#aufbau-reader) ·
[`<aufbau-slider>`](#aufbau-slider) ·
[`<aufbau-table>`](#aufbau-table) ·
[`<aufbau-toc>`](#aufbau-toc) ·
[`<aufbau-toggle>`](#aufbau-toggle) ·
[`<aufbau-tree>`](#aufbau-tree) ·
[`<aufbau-tree-item>`](#aufbau-tree-item) ·
[`<aufbau-upload>`](#aufbau-upload) ·
[`<aufbau-video>`](#aufbau-video) ·
[`<aufbau-waveform>`](#aufbau-waveform) ·
[`<aufbau-writer>`](#aufbau-writer) ·

## aufbau-audio

```html
<aufbau-audio 
  src="/media/track.mp3" 
  title="Cyberpunk Theme" 
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
```

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

## aufbau-datalist

```html
<!-- 1. JSONC mit Kommentaren -->
<datalist is="aufbau-datalist" id="cities" src="/data/cities.jsonc" key="name"></datalist>

<!-- 2. Lesbares YAML -->
<datalist is="aufbau-datalist" id="tags" src="/config/tags.yaml"></datalist>

<!-- 3. Riesen CSV/TSV Tabellen (geparst via PapaParse) -->
<datalist is="aufbau-datalist" id="countries" src="/data/countries.csv" key="CountryName"></datalist>

<!-- 4. TOML Config -->
<datalist is="aufbau-datalist" id="presets" src="/settings/presets.toml" key="title"></datalist>
```

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

## aufbau-index

```html
<!-- Grid view with rounded items -->
<aufbau-index viewmode="grid" item-size="180px" item-shape="rounded" gap="1.5rem">
  <aufbau-item>Standard Item 1</aufbau-item>
  <aufbau-item>Standard Item 2</aufbau-item>
  <!-- Individual child overrides default index shape -->
  <aufbau-item shape="circle">I am a circle!</aufbau-item>
</aufbau-index>

<!-- Horizontal Gallery view -->
<aufbau-index viewmode="gallery" item-size="300px" item-shape="squircle">
  <aufbau-item><img src="photo1.jpg" alt="Photo 1" /></aufbau-item>
  <aufbau-item><img src="photo2.jpg" alt="Photo 2" /></aufbau-item>
</aufbau-index>
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

one-of-n. `look` wechselt nur die darstellung — dasselbe markup funktioniert als
combobox, radiogruppe oder segmented control.

```html
<aufbau-picker name="view" look="segments" value="month">
  <aufbau-option value="day">Tag</aufbau-option>
  <aufbau-option value="month">Monat</aufbau-option>
  <aufbau-option value="year">Jahr</aufbau-option>
</aufbau-picker>

<!-- durchsuchbar, optionen aus einer datei -->
<aufbau-picker name="framework" look="combobox" searchable
               src="/data/frameworks.yaml" placeholder="Framework wählen..."></aufbau-picker>

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

der ladezustand steht als `data-state="loading|ready|error|idle"` am element und
ist damit direkt per css ansprechbar.

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
  <aufbau-toc target="#markdown-container" selector="h2, h3"></aufbau-toc>
</div>
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

## aufbau-video

```html
<aufbau-video youtube-id="dQw4w9WgXcQ"></aufbau-video>
```

## aufbau-waveform

```html
<aufbau-waveform src="/media/track.mp3" bars="60" interactive></aufbau-waveform>
```

## aufbau-writer

mehrzeiliger text, das gegenstück zu [`<aufbau-reader>`](#aufbau-reader).

```html
<aufbau-writer name="bio" placeholder="Kurz über dich..." counter maxlength="280"></aufbau-writer>

<!-- wächst mit, zwischen 3 und 12 zeilen -->
<aufbau-writer name="notiz" autogrow min-rows="3" max-rows="12"></aufbau-writer>

<!-- kindinhalt ist der startwert -->
<aufbau-writer name="entwurf">Erster Entwurf.</aufbau-writer>
```

---

```html
<!-- Remote data fetch for datalist autocomplete -->
<datalist is="aufbau-datalist" id="city-list" src="/api/cities.json" key="name"></datalist>

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
// Inside any method of your component:

// A) Single attribute using the static schema
const vol = this.getAttr('volume');       // Returns parsed number (e.g. 80) or default 50
const isAutoplay = this.getAttr('autoplay'); // Returns boolean (true/false)

// B) Overriding schema type on demand
const rawVolumeString = this.getAttr('volume', String); // Forces returning '80' as String

// C) Overriding schema fallback on demand
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
