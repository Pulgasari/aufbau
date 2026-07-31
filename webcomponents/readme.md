# @aufbau/webcomponents

```md
<aufbau-table>
<aufbau-text> (md-fähig via @aufbau-import, würde ich später mit spezielle text-features erweitern)
<aufbau-breadcrumb>
<aufbau-progess>
<aufbau-toast>
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
```
