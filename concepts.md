# concepts

a collection of approaches, not a plan. nothing here is built yet unless it says
so. each section ends with its open questions.

- [1. a controller for the page](#1-a-controller-for-the-page)
- [2. webgpu and typegpu](#2-webgpu-and-typegpu)

---

## 1. a controller for the page

### the idea

something that watches a part of the page and makes plain attributes work on any
element in it. an attribute appears, the package behind it is imported on first
use and applied; the attribute changes, the effect updates; it goes, the effect is
removed. the element itself knows nothing about it.

```html
<section pattern="dots 8%" filter="grain 0.3">…</section>
<div ass="pad: normal; gap: small">…</div>
<button hotkey="ctrl+s" command="save">…</button>
```

### it is the declarative side of @aufbau/api

`@aufbau/api` already has the imperative half of this:

```js
await aufbau.apply('#hero', { filter: 'grain', pattern: { id: 'dots', fg: '#f00' } });
await aufbau.update('#hero', { pattern: { fg: '#0f0' } });
await aufbau.remove('#hero', ['pattern']);
```

filters, patterns and webfonts share `apply` / `update` / `remove` / `use` /
`load` / `list` for exactly this reason. the controller would be the same calls,
triggered by attributes instead of code:

| attribute on an element | the same as |
|---|---|
| `pattern="dots 8%"` | `aufbau.patterns.apply(element, 'dots', …)` |
| `filter="grain 0.3"` | `aufbau.filters.apply(element, 'grain', …)` |
| `font="lexend heading"` | `aufbau.webfonts.apply(element, 'lexend', { role: 'heading' })` |

so it belongs next to the api, not inside the elements: one table of
`attribute -> { package, apply, update, remove }`, read by the api's lazy loaders.

### global or per root

some things are one per page by nature, some belong to an area of it.

| global, one per document | per root / per area |
|---|---|
| element config (`setConfig`) | routing, views, areas |
| the skin and the layer order | density, geometry, palette, scheme (already `data-*` on `<app-root>`) |
| the icon aliases, the webfont catalogue | which attributes are watched (the table) |
| hotkeys that mean the same everywhere | hotkeys of one app or one view |
| the autoloader | a lazy subtree (a view that loads its elements when shown) |
| gestalt tokens on `:root` | patterns, filters, fonts on elements |

a sketch of the split:

- `@aufbau/api` holds the global half and the table. `aufbau.watch(root = document)`
  starts the controller on a root and returns its stop.
- `<app-root>` calls `aufbau.watch(this)` when it connects and stops it when it
  goes. without an `app-root`, a page calls `aufbau.watch()` once.
- the table is extensible: `aufbau.traits.set('glow', { load, apply, update, remove })`.

the observing itself is `@domina/observer`:

```js
observe({
  '[pattern]': { onMatch: apply, onAttr: { pattern: update }, onRemoved: remove },
  '[filter]' : { onMatch: apply, onAttr: { filter: update },  onRemoved: remove },
});
```

### candidates for the table

- **pattern**, **filter**, **font**. ready: the packages have the contract already.
  zugriff/files does the pattern by hand today (`usePatterns()` in app.js).
- **ass**. ass source compiled into the element's style. its own attribute, never
  `style`: the browser parses `style` itself and drops what is not css before any
  script sees it. open: compile per element vs. collect all into one sheet with
  generated selectors (`[ass-id="…"]`), and how fast compile is in the browser.
- **hotkey**. `hotkey="ctrl+s"` clicks the element, or runs its `command`.
  zugriff has `actions` and `hotkeys` modules that would move here.
- **skeleton**. already an attribute on every element, nothing to do.
- **gesture**. `swipe="left: delete"` through `@aufbau/gestures`, one listener on the root.
- **visible / lazy**. `@domina/observer`'s `onVisible`: load or animate when an
  element enters the viewport (`reveal`, `lazy-src`).
- **persist**. `persist="key"` on any form control: its value in storage, restored
  on load. the input-* have it already, this would extend it to native ones.

### open questions

- one observer per root, or one for the document with the roots as scopes?
  (`@domina/observer` shares one MutationObserver per root already.)
- do attributes cascade? a `pattern` on a section: only the section, or a default
  for the items in it?
- what wins when an element's own attribute and a root-level default disagree?
- does the table live in the api (one import for everything) or in each package
  (`@aufbau/patterns/trait.js`), with the api only collecting them?
- naming: trait, behavior, directive, mixin?

---

## 2. webgpu and typegpu

### what webgpu is

the successor of webgl: a low level api to the gpu, with two kinds of programs
written in wgsl, the webgpu shading language.

- **render pipelines** draw triangles into a texture or a canvas, like webgl.
- **compute pipelines** run any calculation on the gpu, thousands of threads at
  once, over storage buffers and storage textures. webgl has nothing like it.

what matters for us:

- images come in from `ImageBitmap`, `<img>`, `<video>`, `<canvas>`,
  `OffscreenCanvas`, `ImageData` and `VideoFrame` through
  `queue.copyExternalImageToTexture()`. a `VideoFrame` (webcodecs) can also be an
  external texture without a copy.
- it works in workers, with an `OffscreenCanvas`.
- getting results back to javascript is **always async** (`buffer.mapAsync()`),
  there is no synchronous readback. fine for an export, a poor fit for anything
  that has to answer within the same frame.
- the gpu can be lost (driver reset, tab in the background on mobile); a device
  has to be recreated, so state on the gpu has to be rebuildable.

### support, early 2026

baseline since january 2026: chrome and edge (desktop since 113, android since 121
on android 12+ with qualcomm or arm gpus), firefox on windows (141) and apple
silicon macs (145), safari 26 on macos, ios and ipados. firefox on linux and
android is still in progress. the capacitor build of zugriff runs in the android
webview, which is chromium, so android 12+ devices have it.

there is always a device without it, so every use needs a fallback: css/svg,
canvas 2d or webgl, which `@aufbau/filters` has already.

### typegpu

a typescript toolkit over webgpu by software mansion (mit licensed). what it adds:

- **schemas**: `d.struct({ pos: d.vec2f, size: d.f32 })` describes gpu memory once,
  typed on both sides; buffers are created and written from plain js objects.
- **roots** (`tgpu.init()`), typed buffers, uniforms and bind groups instead of
  the hand written layout objects of raw webgpu.
- **functions**: `tgpu.fn([args], returns)` with the body either as a **wgsl
  string** or as a **js function**. js functions are compiled to wgsl, which
  needs the `'use gpu'` directive and the build plugin `unplugin-typegpu`
  (vite, webpack, rollup, esbuild, …).
- `tgpu.resolve()` puts schemas, functions and a wgsl template into one shader.
- companion packages for noise, signed distance fields and color math, plus a
  react native binding (react-native-wgpu).

the catch for us: the nicest part, shaders as js functions, needs a build step.
without the plugin, typegpu still gives typed memory, buffers and bind groups,
and the shaders stay wgsl strings. that fits the no-build rule of aufbau and
zugriff; the bundler (`aufbau/bundler`) could run the plugin for production later.

### where it would help

#### filters (@aufbau/filters)

today: css and svg filters for elements, canvas (imagedata or `ctx.filter`) and
webgl for a `<canvas>`.

- **elements**: no change. css and svg filters are already drawn on the gpu by the
  browser, and webgpu cannot draw into the dom.
- **a canvas or an image to export**: a `webgpu` backend, one compute shader per
  filter. the gain is in **chains**: today every webgl step reads and writes a
  texture through draw calls, a compute chain keeps everything on the gpu and reads
  back once. most visible on large images and on video (live preview of a filter on
  a camera or a `<media-video>`).
- the manifest already lists backends per filter, `webgpu` would be one more, with
  webgl as the fallback.

#### patterns (@aufbau/patterns)

today: svg, used as a background image of an element.

- static patterns: no gain. an svg is tiny and the browser rasterizes it on the
  gpu anyway.
- **procedural and animated ones** (noise, flow fields, reaction diffusion,
  particles): only possible as a canvas layer behind the content, not as a css
  background. a `<canvas>` inside the element, sized to it, fed by a shader. that
  is a new kind of pattern, not a faster old one.
- a middle way: render once on the gpu, hand the result to css as an image
  (`convertToBlob` -> object url). costs a readback, worth it only for patterns
  that svg cannot express.

#### image editing (zugriff)

the best fit of all. a non destructive editor is a chain of operations over one
image, exactly what compute shaders are for:

- adjustments (exposure, curves, levels, hsl, white balance) as one pass each, or
  fused into one shader, live on full resolution while a slider moves.
- blur, sharpen, denoise, lens effects: the expensive ones on the cpu.
- a **histogram** in a compute shader with atomic counters, live.
- resize and rotate with proper resampling (lanczos), crop, perspective.
- layers and masks as textures, blend modes in a shader.
- export: one readback, then `OffscreenCanvas.convertToBlob()` or webcodecs.

#### thumbnails (zugriff/.shared/js/thumbs.js)

today: a server side resizer when there is one, else `createImageBitmap` and a canvas.

- the expensive part is **decoding**, not scaling, and decoding stays on the cpu
  (or in the browser's own decoder). webgpu does not change that.
- first step without any gpu code: `createImageBitmap(blob, { resizeWidth,
  resizeQuality: 'high' })` decodes and scales in one go, often off the main
  thread.
- webgpu would add: better downscaling (mipmaps, lanczos) for very large images,
  and batching many thumbnails through one pipeline. measurable gain only for big
  batches of big images.
- **video thumbnails**: webcodecs decodes a frame, webgpu takes it as an external
  texture, a compute pass scales it. that is a real gain over a hidden `<video>`
  and a canvas.

#### layouts (many / complex elements)

- the **dom's own layout** (css, text, line breaking) runs in the browser on the
  cpu. webgpu cannot take it over, and text measurement stays on the cpu.
- what the gpu can do: **numeric** layout problems with many items. masonry
  positions for 100k items, force directed graphs, collision, packing, physics,
  clustering of points on a map. the results come back async, so it suits a
  recalculation after a change, not a per frame dom update.
- for `<data-index>` with huge folders the order is: virtualization first (render
  only what is visible, `content-visibility` is there already), a worker for the
  arithmetic second, the gpu only when the item count goes into the hundreds of
  thousands or the layout is drawn into a canvas anyway.
- views that **draw** instead of building dom (a timeline, a waveform with
  thousands of bars, a graph, a canvas grid of thumbnails) are where the gpu wins
  outright: layout and drawing in the same place, no dom at all.

### risks

- no synchronous readback: the gpu is a separate world, every answer is a promise.
- device loss, especially on mobile when the app goes to the background.
- power: a compute pass on every input event drains a phone; throttle to
  `requestAnimationFrame` and stop when hidden.
- support gaps (firefox android, older android gpus): every feature needs its
  fallback, and the fallback is what most of the testing has to cover.
- typegpu's js shaders need a build step, see above.

### first experiments, small and separate

1. **thumbnails**: measure `createImageBitmap` with `resizeWidth` against the
   current canvas path on a folder of photos. no gpu yet, maybe the biggest win.
2. **a webgpu backend for two or three filters** in @aufbau/filters (blur, a
   color matrix, grain), chained, against the webgl backend on a large image.
3. **a typegpu spike without the plugin**: schemas, buffers and wgsl strings,
   loaded through the importmap, to see how much remains without a build step.
4. **a histogram** of an image in a compute shader, as the seed of an editor.
5. **a procedural pattern** (noise) as a canvas layer, to see if the result is
   worth a new kind of pattern.

### open questions

- a gpu device per app or one shared (`aufbau.gpu()`, lazily created, recreated on
  loss)? the second fits the "global" column of section 1.
- does typegpu become a dependency, or is raw webgpu with a few own helpers enough
  for what aufbau needs?
- workers: run the gpu work in a worker by default, so the main thread stays free?

### sources

- [webgpu is now supported in major browsers (web.dev)](https://web.dev/blog/webgpu-supported-major-browsers)
- [webgpu (wikipedia)](https://en.wikipedia.org/wiki/WebGPU)
- [from webgl to webgpu (chrome for developers)](https://developer.chrome.com/blog/from-webgl-to-webgpu)
- [GPUQueue.copyExternalImageToTexture() (mdn)](https://developer.mozilla.org/docs/Web/API/GPUQueue/copyExternalImageToTexture)
- [typegpu docs](https://docs.swmansion.com/TypeGPU/), [build plugin](https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu/), [functions](https://docs.swmansion.com/TypeGPU/fundamentals/functions), [resolve](https://docs.swmansion.com/TypeGPU/fundamentals/resolve)
- [type safety in webgpu applications, the typegpu approach (software mansion)](https://rec.swmansion.com/blog/type-safety-in-webgpu-applications-the-typegpu-approach-5df019ac6a61/)
- [typescript on the gpu (gitnation talk)](https://gitnation.com/contents/typescript-on-the-gpu-bridging-the-gap-between-realms)
