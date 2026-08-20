# @aufbau/filters

every filter is a plain js function that generates an svg `<filter>`. import one on
its own, or go through the barrel for the catalogue and the dom api. the static
assets under [`@aufbau/svg/filters`](../svg/filters) are generated from these
functions (see [`.github/scripts`](../.github/scripts)).

open [`index.html`](index.html) to try them live.

## a single filter

```javascript
import blur from '@aufbau/filters/blur';

blur();                 // <filter id="aufbau-filter-blur">…</filter>, defaults baked in
blur({ amount: 6 });    // baked with amount = 6
blur({ live: true });   // stdDeviation="var(--aufbau-filter-amount, 2)"

// named metadata alongside the default export
import { id, name, vars } from '@aufbau/filters/blur';
```

`live: true` swaps concrete values for `var(--aufbau-filter-<key>, <default>)`, which
is the form the injected `<defs>` and the generated `.svg` assets use so css custom
properties keep driving the primitives. some vars are `bake`-only (animation timing,
filter-primitive geometry) because those attributes cannot read a css var.

## still vs. motion

every animated filter carries an `animate` option (default `true`). set it `false` to
drop the `<animate>` tracks and freeze the effect at its resting frame:

```javascript
import badTv from '@aufbau/filters/bad-tv';

badTv();                    // rolling, warping bad signal
badTv({ animate: false });  // the same distortion, held still
```

it works through the dom api too — `applyFilter('#el', 'bad-tv', { animate: false })`
injects a separate static variant, so motion and still can coexist on the page.

## the catalogue

33 filters, grouped loosely: colour/tone (`posterize`, `solarize`, `duotone`,
`hue-saturation`, `instacolor`, `thermal`, `linocut`), convolutions (`edges`,
`emboss`, `sharpen`), blur/light (`blur`, `glow`, `smear`, `tilt-shift`,
`barrel-blur`, `vignette`), displacement (`wave`, `jitter`, `melt`, `wobble`,
`shake`, `slices`), chromatic/glitch (`rgb-shift`, `glitch-rgb`, `glitch-live`,
`glitch-heavy-cyber`, `rainbow`, `bad-tv`), grain/screen (`grain`, `scanlines`,
`dot-matrix`, `halftone`, `night-vision`). `list()` returns the live catalogue.

a few (`dot-matrix`, `halftone`, `linocut`, `barrel-blur`, `slices`) are stylised
approximations — svg filter primitives cannot express a true half-tone screen, radial
blur or slice glitch, so those trade exactness for a convincing look. genuinely
out-of-reach effects (pixelate, polar pixelate, mirror) are left out: pixelation needs
downsampling (`image-rendering`/canvas) and mirror is a geometry transform
(`transform: scaleX(-1)`), neither of which is a filter primitive.

## the dom api

```javascript
import { applyFilter, removeFilter, list } from '@aufbau/filters';

applyFilter('#logo', 'glitch-rgb', { offsetX: 6 });
removeFilter('#logo');

list(); // [{ id, name, vars }, …] — used by preview pages and tooling
```

`applyFilter` injects the `<filter>` once into a shared hidden host and sets
`filter: url(#aufbau-filter-<id>)`, writing any passed options as inherited custom
properties. `ensureFilter(id)` does just the injection (no target), and
`useFilter(id, options)` binds one filter into a small handle:

```javascript
import { useFilter } from '@aufbau/filters';

const glitch = useFilter('glitch-rgb', { offsetX: 6 });
glitch.ensure();          // inject defs
glitch.apply('#logo');    // apply to targets
glitch.css;               // "filter: url(#aufbau-filter-glitch-rgb);"
```

## backends

a filter is an effect that can be realised through more than one technique. the default
export is the **svg** backend; some filters also carry a native **css** backend, and some
are **canvas**-only (imageData). see [`backends.md`](backends.md) for the full model.

```javascript
import { filterCss, filterCanvas, supports } from '@aufbau/filters';

supports('blur');                    // { css: true, svg: true, canvas: true }
filterCss('blur', { amount: 4 });    // "blur(4px)"  (null if no css backend)
applyFilter('#el', 'blur', { amount: 4, backend: 'css' }); // force a backend

// canvas: imageData filters (pixelate, polar-pixelate, dither, threshold) or, for any
// css/svg filter, the ctx.filter bridge — all through one call, in place.
filterCanvas(myCanvas, 'pixelate', { size: 12 });
filterCanvas(myCanvas, 'sepia');
```

try the canvas filters live in [`canvas.html`](canvas.html).

## usage with @aufbau/stylesheet

built into `@aufbau/stylesheet`, which injects the defs during its async pre-pass:

```css
#logo      { aufbau-filter: glitch-rgb offsetX(6); }
.wave-band { aufbau-filter: wave frequency(0.04) scale(35); }
```
