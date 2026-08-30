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

two modes: `datauri` (default) bakes options into a `background-image: url("data:…")`;
`defs` injects a `<pattern>` and references it by `url(#id)`, keeping paint options
live through custom properties.

```javascript
import { applyPattern, removePattern, patternImage, list } from '@aufbau/patterns';

applyPattern('.box', 'dots', { fg: '#ff0000' });          // data-uri
applyPattern('.box', 'dots', { fg: '#ff0000', mode: 'defs' });
removePattern('.box');

patternImage('dots', { fg: '#ff0000' }); // 'url("data:image/svg+xml,…")'
list();                                   // [{ id, name, vars }, …]
```

`usePattern(id, options)` binds one pattern into a small handle:

```javascript
import { usePattern } from '@aufbau/patterns';

const dots = usePattern('dots', { fg: '#ff0000' });
dots.image();          // the data-uri
dots.apply('.box');    // paint targets
```

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

motion is a layer *on top* of a pattern: it scrolls the whole tiling and does not
care what the tile contains or whether the tile animates itself. it animates
`background-position` by exactly one tile, so the loop is seamless.

```javascript
import { animatePattern, stopMotion } from '@aufbau/patterns';

animatePattern('.hero', 'grid', { motion: 'down', speed: '12s', fg: '#334' });
animatePattern('.hero', 'dots', { motion: 'up-right' });   // any diagonal too
stopMotion('.hero');
```

directions: `down`, `up`, `left`, `right`, `down-right`, `down-left`, `up-right`,
`up-left` (`move-down` / `downwards` are accepted and normalised).

for a css-only background (no js on the element), bake the rule with `motionCss`:

```javascript
import { patternImage } from '@aufbau/patterns';
import { motionCss }    from '@aufbau/patterns/motion';

const { keyframes, animation } = motionCss('down', { size: 40, speed: '12s' });
// inject `keyframes` into a <style>, then on the element:
//   background-image: <patternImage('grid', { size: 40 })>;
//   animation: <animation>;
```

`usePattern(id, opts).animate(target)` is the handle form.
