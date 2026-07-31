# @aufbau/webcomponents

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
