# @aufbau/patterns

every pattern is a plain js function that generates a tileable svg. import one on its
own, or go through the barrel for the catalogue and the dom api. the static assets
under [`@aufbau/svg/patterns`](../svg/patterns) are generated from these functions
(see [`.github/scripts`](../.github/scripts)).

open [`index.html`](index.html) to try them live.

## a single pattern

```javascript
import dots from '@aufbau/patterns/dots';

dots();                     // full <svg> tile, defaults baked in
dots({ fg: '#ff0000' });    // baked with fg = red
dots({ live: true });       // fill="var(--aufbau-pattern-fg, #000000)"

// named metadata alongside the default export
import { id, name, vars } from '@aufbau/patterns/dots';
```

paint vars (`bg`, `fg`) stay live via `var(--aufbau-pattern-<key>, <default>)`;
geometry vars (`size`, `radius`, `rotate`, `width`) are `bake`-only because they land
in plain svg attributes that cannot read a css var.

## the dom api

painted as `background-image: url("data:…")`, options baked in. the contract is
shared with `@aufbau/filters` and `@aufbau/webfonts`:

```javascript
import { apply, remove, update, use, list } from '@aufbau/patterns';

await apply('.box', 'dots', { fg: '#ff0000' });
await update('.box', { fg: '#00ff00' });   // the pattern already on .box, new options
remove('.box');

list();                                    // [{ id, name, vars }, …], also as `data`
```

`use(id, options)` gives a `Pattern`, one pattern bound to its options:

```javascript
const dots = use('dots', { fg: '#ff0000' });

await dots.svg();          // the <svg> tile
await dots.image();        // 'url("data:image/svg+xml,…")'
await dots.css();          // 'background-image: url(…);'
await dots.apply('.box');
```

`applyPattern`, `removePattern`, `updatePattern`, `usePattern`, `patternImage` and
`patternSvg` stay as named aliases.

## usage with @aufbau/stylesheet

built into `@aufbau/stylesheet`, which prebuilds the data-uri during its async
pre-pass (colour tokens resolve like `aufbau-icon`):

```css
.box { aufbau-pattern: dots bg(transparent) fg(#FF0000) rotate(90); }
```

## the catalogue

`bricks`, `checks`, `chevron`, `crosses`, `crosshatch`, `diagonal`, `diamonds`,
`dots`, `grid`, `rings`, `squares`, `stripes`, `triangles`, `waves`. every tile is
seamless, so it repeats without a visible seam in any direction.

## motion

motion scrolls the whole tiling by one tile per cycle, so the loop is seamless. it
does not care what the tile contains or whether the tile animates itself. it is an
option of `apply`:

```javascript
await apply('.hero', 'grid', { fg: '#334', motion: 'down', speed: '12s' });
await apply('.hero', 'dots', { motion: 'up-right' });   // diagonals too
await update('.hero', { motion: null });                // stops it
```

directions: `down`, `up`, `left`, `right`, `down-right`, `down-left`, `up-right`,
`up-left`. `speed` is any css `<time>`, `timing` any timing function.

`Motion` is the same without a pattern, for a background painted elsewhere or a
css only rule:

```javascript
import { Motion } from '@aufbau/patterns/motion';

const motion = new Motion('down', { size: 40, speed: '12s' });
motion.apply('.hero');
motion.keyframes;   // '@keyframes aufbau-pattern-down-40 { … }'
motion.animation;   // 'aufbau-pattern-down-40 12s linear infinite'
Motion.stop('.hero');
```
