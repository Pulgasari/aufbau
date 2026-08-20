# @aufbau/filters — rendering backends

A filter here is an **effect descriptor** (`id`, `name`, `vars`) that can be *realised*
by more than one *backend*. Today there is one backend (`svg`); this document is the
plan for making a filter available through several techniques, and the contract they
share. Goal: long-term, cover essentially every web image/effect technique behind one
catalogue and one set of parameters.

---

## 1. The techniques that exist on the web

| technique | apply to a DOM element? | per-pixel / arbitrary? | realtime / video? | notes |
|---|---|---|---|---|
| **CSS filters** (`filter:`, `backdrop-filter`, blend modes) | yes, trivially | no — fixed function set | yes, GPU | `blur/brightness/contrast/grayscale/hue-rotate/invert/opacity/saturate/sepia/drop-shadow`. cheapest, animatable, but a closed set. |
| **SVG filters** (`<filter>` primitives) | yes, `filter: url(#id)` | partly — matrices, transfer, convolution, displacement, turbulence; no resampling | yes, GPU (heavy graphs cost) | declarative, composable, works on HTML/SVG/`<video>`. our current backend. no true pixelate/polar/zoom-blur. |
| **Canvas 2D — `ctx.filter`** | indirectly (draw element→canvas) | no (same function set as CSS/SVG) | frame-by-frame | **bridge**: `ctx.filter = 'blur(2px)'` *or* `'url(#svgFilter)'` runs our css/svg backends on a canvas draw — free canvas support for every filter we already have. |
| **Canvas 2D — `getImageData`/`putImageData`** | no (canvas only) | **yes, arbitrary JS per pixel** | not really (CPU, ok for stills/export) | the flexible CPU path: true pixelate, dithering, halftone, curves/LUTs, arbitrary kernels. what pixels.js / CamanJS do. slow on big images. |
| **Canvas — draw scaling** (`imageSmoothingEnabled=false`) | no | resampling only | yes | genuine pixelate via downscale→upscale. cheap. |
| **WebGL / WebGL2** (fragment shaders) | no (canvas) | **yes, GPU per pixel, multi-pass** | **yes, realtime** | the heavyweight: everything, fast. glfx.js / PixiJS filters / three postprocessing. steep. the "cover everything" tier. |
| **WebGPU** (render + compute shaders) | no (canvas) | yes, GPU, compute | yes, realtime | successor to WebGL; great for heavy pipelines. support still maturing (Chrome shipped, Safari/FF partial). long-term. |
| **WebCodecs + OffscreenCanvas + Worker** | n/a (plumbing) | n/a | yes, off main thread | how you feed video frames into a WebGL/WebGPU or imageData backend without janking the UI. relevant to the video app. |
| **Houdini Paint API** (`registerPaint`, `paint()`) | as a background/border image | draws, doesn't read source pixels | yes | can generate patterns/noise; can't read an element's pixels to filter them. niche, Chromium-only. |
| **WASM** | n/a | yes (CPU, fast) | maybe | compiled image code to speed up the imageData path when JS loops are too slow. |

**Short version:** the four that matter for us are **CSS filters**, **SVG filters**,
**Canvas 2D** (both the `ctx.filter` bridge *and* raw `imageData`), and **WebGL** (later
WebGPU). Houdini/WebCodecs/WASM are supporting cast.

---

## 2. The multi-backend model

Separate *what an effect is* from *how it is drawn*:

- **descriptor** — `{ id, name, vars }`. backend-agnostic. one source of truth (already
  the case).
- **backends** — a filter may implement any of: `css`, `svg`, `canvas`, `webgl`. Not
  every filter implements every backend; some are one only (e.g. `pixelate` is
  canvas/webgl-only, `grain` is svg/webgl-only).
- **capability matrix** — each filter declares which backends it supports; the api
  reports it (`supports(id)`).
- **resolver** — given a *target* (element / image / canvas / video) and a *preference*,
  pick the best available backend for that filter.

```
target ──► resolver ──► backend ──► realise
element      prefers     css > svg          filter: blur(2px)  /  filter: url(#id)
canvas       prefers     canvas(imageData) > ctx.filter(css|svg-bridge) > webgl
video        prefers     css/svg on <video>  (cheap, live)  OR  webgl on a canvas (heavy)
editor       prefers     webgl > canvas(imageData)   (realtime, multi-pass, non-destructive)
```

### backend contract (module exports)

The default export stays the **svg** generator (so `import blur from '@aufbau/filters/blur'`
and direct call keep working). Other backends are optional named exports:

```js
export const id = 'blur', name = 'Blur';
export const vars = { amount: { type:'number', default:2, min:0, max:20, step:0.5, unit:'px' } };

export default function blur (o = {}) { /* → <filter> markup (svg backend) */ }

export const css = (o = {}) => `blur(${o.amount ?? 2}px)`;          // css backend (optional)
// future:
// export const canvas = (imageData, o) => { /* mutate pixels in place */ };
// export const webgl  = { fragment: `…glsl…`, uniforms: (o) => ({ … }) };
```

The registry collects whatever each module exposes:

```js
{ id, name, vars, render: m.default /* svg */, css: m.css ?? null /* , canvas, webgl */ }
```

### api surface

```js
filterSvg(id, o)          // <filter> string          (have)
filterCss(id, o)          // "blur(2px)" or null       (this step)
supports(id)              // { css, svg, canvas, webgl }
applyFilter(el, id, o)    // DOM: backend:'auto'|'css'|'svg' — auto prefers css when available
filterToCanvas(ctx, id, o)// canvas: imageData backend, else ctx.filter bridge   (next step)
useFilter(id, o)          // handle, backend-aware
```

`applyFilter` gains `{ backend }`: `auto` (default) prefers `css` when the filter has it
(cheaper, GPU, animatable), else falls back to the svg defs-injection path we already have.

---

## 3. Per-backend status & detail

### css — *this step*

The native subset. For a filter with a real CSS equivalent, `css(o)` returns a
`<filter-function>` string. Covered now: `blur`, `hue-saturation`, and the standard
adjustments `brightness`, `contrast`, `grayscale`, `invert`, `saturate`, `sepia`
(each also has an svg backend, so they work off-DOM too). CSS functions accept `var()`
natively, so a live form (`blur(var(--aufbau-filter-amount,2))`) is a trivial extension.

### svg — *done*

33 filters. See [`readme.md`](readme.md). Stays the default/richest DOM backend for
everything CSS can't express.

### canvas 2d — *done*

`filterCanvas(canvas, id, options)` applies a filter to a canvas in place, over two tiers:

1. **imageData:** filters that svg/css cannot do export `canvas(imageData, options)` and
   walk pixels directly. Shipped: **pixelate**, **polar-pixelate**, **dither** (Bayer
   ordered), **threshold**. Next: **true halftone** (dot size ∝ luminance), **levels/
   curves**, **channels**, the pixels.js-style set. CPU-bound; fine for editor ops and
   export, not for 60fps video.
2. **bridge:** for everything else, `ctx.filter` is set to the css string (when the
   filter has a css backend) or to `url(#id)` after injecting a **baked** svg `<filter>`
   (concrete values — canvas draws can't read css custom properties), then the canvas is
   drawn through it onto a scratch copy and back. Gives *every* css/svg filter a canvas
   path with no per-filter code. `backend: 'imagedata' | 'bridge' | 'auto'` forces a tier.

Note: `ctx.filter` with `url(#…)` needs the svg filter in the document (handled) and is
solid in Chrome/Firefox; Safari added canvas `filter` in 16.4 and its `url()` support is
still spotty — the css-string bridge and the imageData tier are the safe paths there.

### webgl — *later, sketch only*

A `webgl` backend = a GLSL fragment shader + a uniform mapping from `vars`. A small runner
compiles the shader, uploads the source as a texture, renders to a framebuffer; multi-pass
effects chain framebuffers (blur = 2 passes, bloom = threshold+blur+combine). This is the
realtime, "cover everything" tier: pixelate, polar pixelate, fisheye/barrel *distortion*
(real, not our approximation), zoom/radial blur, kaleidoscope/mirror, chromatic aberration,
displacement, convolutions — all at video framerate. Lazily loaded so DOM-only users never
pay for it. WebGPU is the eventual upgrade (compute shaders for heavy pipelines).

---

## 4. Mapping to the apps

- **video player** — overlay a **css/svg** filter directly on the `<video>` element:
  cheap, live, no pipeline, keeps native playback. Good for colour grades, glitch,
  scanlines, vignette. If a heavy or impossible-in-svg effect is needed, switch that view
  to drawing frames onto a **canvas + webgl**.
- **image editor (zugriff)** — a **webgl** pipeline: non-destructive stack of passes,
  realtime preview, GPU. **canvas/imageData** as the fallback and for export / algorithms
  that are simpler on CPU. The descriptor + `vars` drive the editor's control UI (same
  metadata the test pages already use).
- **general DOM** — `applyFilter` on any element; css when possible, svg otherwise.

---

## 5. Capability matrix (target)

| group | css | svg | canvas (bridge) | canvas (imageData) | webgl |
|---|:--:|:--:|:--:|:--:|:--:|
| blur, hue-saturation, brightness/contrast/grayscale/invert/saturate/sepia | ✓ | ✓ | ✓ | ✓ | ✓ |
| glitch\*, grain, wave, edges/emboss/sharpen, glow, smear, vignette, tilt-shift, barrel-blur, jitter/melt/wobble/shake/slices, rainbow, bad-tv, rgb-shift, posterize/solarize/duotone/instacolor/thermal/scanlines/night-vision, dot-matrix, halftone, linocut | – | ✓ | ✓ | (some) | ✓ |
| **pixelate, polar-pixelate, dithering, true halftone, mirror, fisheye, zoom-blur, kaleidoscope** | – | – | – | ✓ | ✓ |

The bottom row is exactly what svg couldn't do — it arrives with the canvas/imageData and
webgl backends.

---

## 6. Roadmap

1. **css backend + contract** *(done)* — descriptor/backends model, `filterCss`,
   `supports`, `applyFilter({backend})`, the 8 css-capable filters.
2. **canvas backend** *(done)* — `filterCanvas` with the imageData tier
   (`pixelate`, `polar-pixelate`, `dither`, `threshold`) and the `ctx.filter` bridge
   (css string / baked svg) for every other filter. demo: [`canvas.html`](canvas.html).
3. **webgl backend** — shader runner + uniform mapping; port the heavy/realtime effects;
   real `pixelate`/`fisheye`/`mirror`/`zoom-blur`.
4. **generator** already writes the svg assets; extend it to also emit a JSON capability
   catalogue so tooling/editor know each filter's backends without importing them.

## 7. imageData filter ideas (pixels.js-adjacent) for step 2

`pixelate`, `polar-pixelate`, `dither` (ordered/Bayer + Floyd–Steinberg), `threshold`,
`true-halftone` (variable dot), `levels`/`curves`, `channels` (per-channel gain/offset),
`crt` (curvature + scanline + bloom combo), `warhol` (tiled palette swap), `mosaic`
(voronoi/triangular), `oil-paint` (kuwahara), `ascii`/`dot` maps. All are per-pixel or
neighbourhood ops that fit the imageData tier and later port to webgl for realtime.
