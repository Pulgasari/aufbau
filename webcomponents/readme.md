# @aufbau/webcomponents

```md
<aufbau-button> (optinal icon und label/text attribut, aber auch childrnr möglich>
<aufbau-code>
<aufbau-table> (hab gar kein bock table von hand zu bauen, also kann das teil nur objekte und vllt arrays entgegennehmen, und natürlich @aufbau/import wie datalist)
<aufbau-text> (md-fähig via @aufbau-import, würde ich später mit spezielle text-features erweitern)
<aufbau-checkbox>
<aufbau-combobox>
<aufbau-number>
<aufbau-slider> (optional mit inc/dec buttons und/oder numberdisplay das auch input kann und optionalem unit display)
<aufbau-toast>
<aufbau-audio> (optional mit image, diverse layouts)
<aufbau-waveform>
<aufbau-tree>
<aufbau-tree-item>

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
<aufbau-loop>
<aufbau-media> (allrounder?)
<aufbau-modal>
<aufbau-paginate>
<aufbau-popup>
<aufbau-progress>
<aufbau-scroller>
<aufbau-skeleton>
<aufbau-svg>
<aufbau-terminal>
<aufbau-toolbar>

<aufbau-action-menu>
<aufbau-context-menu>
<aufbau-menu-item>
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
<aufbau-input type="text" list="city-list" placeholder="Select City..."></aufbau-input>
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

---

```html
<!-- Remote data fetch for datalist autocomplete -->
<datalist is="aufbau-datalist" id="city-list" src="/api/cities.json" key="name"></datalist>

<!-- Input with preset icon & datalist linkage -->
<aufbau-input type="email" placeholder="Enter your email"></aufbau-input>
<aufbau-input type="text" list="city-list" placeholder="Select City..."></aufbau-input>

<!-- Filter search bar connected directly to an aufbau-index layout -->
<aufbau-filter target="aufbau-index aufbau-item" placeholder="Search items..."></aufbau-filter>

<aufbau-index viewmode="grid" item-look="200px squircle">
  <aufbau-item>Apple iPhone 15</aufbau-item>
  <aufbau-item>Samsung Galaxy S24</aufbau-item>
  <aufbau-item>Google Pixel 8</aufbau-item>
</aufbau-index>

<!-- Flagge -->
<aufbau-flag code="de" variant="circle"></aufbau-flag>
<aufbau-flag code="us"></aufbau-flag>

<!-- Video / YouTube -->
<aufbau-video youtube-id="dQw4w9WgXcQ"></aufbau-video>

<!-- Toggle -->
<aufbau-toggle label="Darkmode aktivieren" checked></aufbau-toggle>

<!-- Dropdown -->
<aufbau-dropdown label="Optionen">
  <a href="#edit">Bearbeiten</a>
  <a href="#delete">Löschen</a>
</aufbau-dropdown>

<!-- Switch / Segmented Control -->
<aufbau-switch value="month" mode="buttons">
  <option value="day">Tag</option>
  <option value="month">Monat</option>
  <option value="year">Jahr</option>
</aufbau-switch>

<!-- 1. Button mit Icon + Attribut-Text -->
<aufbau-button icon="lucide:save" label="Speichern" variant="primary"></aufbau-button>

<!-- 2. Button mit Icon + Custom Children HTML -->
<aufbau-button icon="lucide:trash-2" variant="danger">
  <strong>Löschen</strong> <small>(irreversibel)</small>
</aufbau-button>

<!-- 3. Tabelle direkt aus einer CSV-Datei -->
<aufbau-table src="/data/users.csv"></aufbau-table>

<!-- 4. Tabelle aus YAML, beschränkt auf bestimmte Spalten -->
<aufbau-table src="/config/servers.yaml" columns="name, ip, status"></aufbau-table>

<!-- 1. Code-Block mit Inline-Text -->
<aufbau-code lang="javascript">
const greet = (name) => `Hello, ${name}!`;
console.log(greet('aufbau'));
</aufbau-code>

<!-- 2. Code-Block via Attribut (ohne Copy-Button) -->
<aufbau-code lang="css" code="body { margin: 0; background: #000; }" no-copy></aufbau-code>

<!-- 3. Text-Element, das direkt eine Markdown-Datei lädt -->
<aufbau-text src="/docs/getting-started.md"></aufbau-text>

<!-- 4. Text-Element mit inline Markdown -->
<aufbau-text raw="# Dynamic Title&#10;This is **inline** markdown content."></aufbau-text>

<!-- 1. Checkbox -->
<aufbau-checkbox label="AGB akzeptieren" checked></aufbau-checkbox>

<!-- 2. Combobox (aus Remote YAML oder inline options) -->
<aufbau-combobox src="/data/frameworks.yaml" placeholder="Framework wählen..."></aufbau-combobox>

<!-- 3. Number Input mit Einheit -->
<aufbau-number value="16" min="8" max="64" step="2" unit="px"></aufbau-number>

<!-- 4. Slider mit +/- Buttons & editierbarem Textfeld -->
<aufbau-slider value="300" min="0" max="1000" step="50" unit="ms" controls editable></aufbau-slider>

```
