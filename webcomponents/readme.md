# @aufbau/webcomponents

[usage](#usage)
[config](#config)
[components](#components)

## usage

### autoloader

the components load automatically as soon as they appear in the DOM. fits best for usage directly in the browser.

```html
<script type="module">
  import { autoloader } from '@aufbau/components';
  autoloader();
</script>

<!-- Magic happens:  -->
<aufbau-flag code="de"></aufbau-flag>
<aufbau-slider value="50"></aufbau-slider>
```

### register all components at once

registers all components at once. is good for prototyping.

```javascript
import '@aufbau/components';
```

### register components one by one

only register the components you need.

```javascript
import '@aufbau/components/button';
import '@aufbau/components/flag';
```

or do it explictily in case you wanna rename the components or whatever.

```javascript
import { AufbauFlag } from '@aufbau/components/flag';

customElements.define('aufbau-flag', AufbauFlag);
```

```md
<aufbau-avatar>
<aufbau-breadcrumb>
<aufbau-colorpicker>
<aufbau-copy>
<aufbau-dash>
<aufbau-dash-panel>
<aufbau-epub>
<aufbau-fake> (um so fake elemente zu generieren für testing und prototyping)
<aufbau-flyout>
<aufbau-graph>
<aufbau-gui>
<aufbau-image> (kann zb gifs nicht automatisch abspielen usw>
<aufbau-include>
<aufbau-keyboard>
<aufbau-media> (allrounder?)
<aufbau-modal>
<aufbau-paginate>
<aufbau-popup>
<aufbau-scroller>
<aufbau-skeleton>
<aufbau-svg>
<aufbau-terminal>
<aufbau-toolbar>

<aufbau-action-menu>
<aufbau-context-menu>
<aufbau-menu-item>
```

# Components

[`<aufbau-audio>`](#aufbau-audio) ·
[`<aufbau-button>`](#aufbau-button) ·
[`<aufbau-checkbox>`](#aufbau-checkbox) ·
[`<aufbau-code>`](#aufbau-code) ·
[`<aufbau-combobox>`](#aufbau-combobox) ·
[`<aufbau-config>`](#aufbau-config) ·
[`<aufbau-datalist>`](#aufbau-datalist) ·
[`<aufbau-dropdown>`](#aufbau-dropdown) ·
[`<aufbau-filter>`](#aufbau-filter) ·
[`<aufbau-flag>`](#aufbau-flag) ·
[`<aufbau-icon>`](#aufbau-icon) ·
[`<aufbau-index>`](#aufbau-index) ·
[`<aufbau-input>`](#aufbau-input) ·
[`<aufbau-loop>`](#aufbau-loop) ·
[`<aufbau-number>`](#aufbau-number) ·
[`<aufbau-progress>`](#aufbau-progress) ·
[`<aufbau-slider>`](#aufbau-slider) ·
[`<aufbau-switch>`](#aufbau-switch) ·
[`<aufbau-table>`](#aufbau-table) ·
[`<aufbau-text>`](#aufbau-text) ·
[`<aufbau-toc>`](#aufbau-toc) ·
[`<aufbau-toggle>`](#aufbau-toggle) ·
[`<aufbau-tree>`](#aufbau-tree) ·
[`<aufbau-tree-item>`](#aufbau-tree-item) ·
[`<aufbau-video>`](#aufbau-video) ·
[`<aufbau-waveform>`](#aufbau-waveform) ·
[`<aufbau->`](#aufbau-) ·

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

## aufbau-checkbox

```html
<aufbau-checkbox label="AGB akzeptieren" checked></aufbau-checkbox>
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

## aufbau-combobox

```html
<aufbau-combobox src="/data/frameworks.yaml" placeholder="Framework wählen..."></aufbau-combobox>
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

```html
<!-- Input with preset icon & datalist linkage -->
<aufbau-input type="email" placeholder="Enter your email"></aufbau-input>
```

... with [<aufbau-datalist>](#aufbau-datalist)]
```html
<aufbau-input type="text" datalist="city-list" placeholder="Select City..."></aufbau-input>
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

## aufbau-number

```html
<aufbau-number value="16" min="8" max="64" step="2" unit="px"></aufbau-number>
```

## aufbau-progress

```html
<!-- 1. Scroll-Fortschrittsbalken oben an der Seite -->
<aufbau-progress type="scroll" target="body"></aufbau-progress>

<!-- 2. Standard Progress-Bar mit Prozentanzeige -->
<aufbau-progress value="75" max="100" show-text unit="%"></aufbau-progress>
```

## aufbau-slider

```html
<aufbau-slider value="300" min="0" max="1000" step="50" unit="ms" controls editable></aufbau-slider>
```

## aufbau-switch

```html
<aufbau-switch value="month" mode="buttons">
  <option value="day">Tag</option>
  <option value="month">Monat</option>
  <option value="year">Jahr</option>
</aufbau-switch>
```

## aufbau-table

```html
<!-- 3. Tabelle direkt aus einer CSV-Datei -->
<aufbau-table src="/data/users.csv"></aufbau-table>

<!-- 4. Tabelle aus YAML, beschränkt auf bestimmte Spalten -->
<aufbau-table src="/config/servers.yaml" columns="name, ip, status"></aufbau-table>
```

## aufbau-text

```html
<!-- 3. Text-Element, das direkt eine Markdown-Datei lädt -->
<aufbau-text src="/docs/getting-started.md"></aufbau-text>

<!-- 4. Text-Element mit inline Markdown -->
<aufbau-text raw="# Dynamic Title&#10;This is **inline** markdown content."></aufbau-text>
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

```html
<aufbau-toggle label="Darkmode aktivieren" checked></aufbau-toggle>
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

## aufbau-video

```html
<aufbau-video youtube-id="dQw4w9WgXcQ"></aufbau-video>
```

## aufbau-waveform

```html
<aufbau-waveform src="/media/track.mp3" bars="60" interactive></aufbau-waveform>
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
