# @aufbau/stylescript

Styles authored directly in JavaScript. The JS-native counterpart to
`@aufbau/stylesheet`'s `.ass` pseudo-CSS: a central controller holds aliases,
tokens, custom-property vars and reusable traits, and renders named, layered
stylesheets — with a content-addressed cache so warm visits don't flicker.

## Controller

`ass` is the default global controller; `createController()` makes an isolated one
(own aliases/tokens/vars/traits/sheets and default adopt target).

```js
import { ass, createController, stylesheet } from '@aufbau/stylescript';

// isolated context, e.g. per widget / shadow root
const widget = createController({ target: shadowRoot });
```

## Registries

Each registry is a proxy: read a key back, set one, or bulk-assign an object (which
merges, it does not replace the registry).

```js
// property-name aliases (literal)
ass.aliases.bg = 'background-color';
ass.aliases    = { fg: 'color', fs: 'font-size', rad: 'border-radius' };

// value tokens (literal substitution, whole value or bare word inside a value)
ass.tokens.cc = 'currentcolor';

// custom-property vars -> emits :root { --brand: … } and reads back as var().
// a [light, dark] pair becomes light-dark() (see Theming).
ass.vars.brand   = '#5865f2';
ass.vars.surface = ['#ffffff', '#111111'];
String(ass.vars.brand); // "var(--brand, #5865f2)"

// breakpoints for the @<name> media shorthand (see Responsive)
ass.breakpoints.tablet = '768px';

// traits: reusable declaration sets (see below)
ass.traits.card = { padding: '1rem', rad: '8px' };
```

## Sheets

`createSheet()` builds a sheet bound to the controller (no auto-registration);
`stylesheet()` is the same, bound to the default `ass` — the module-per-sheet
pattern. Assign into `ass.sheets` to register and author:

```js
ass.sheets.layout = ass.createSheet({ id: 'layout', layer: 'base' });

// assigning a plain object DEEP-MERGES it into the sheet (it does not replace)
ass.sheets.layout = {
  body:       { bg: '#0d0f12', fg: '#f1f5f9', margin: 0, padding: '2rem' },
  '#content': { maxWidth: '800px', margin: '0 auto' },
  'h1, h2':   { borderBottom: `1px solid cc` },
};
ass.sheets.layout = { '#content': { padding: '1rem' } }; // merged in, not overwritten

ass.adopt(); // adopts every registered sheet (+ layer order + :root vars)
```

A held reference uses `.define()` (chainable) and `.adopt()/.release()`:

```js
import skin from './skin.js'; // export default stylesheet({ id: 'skin' }).define({ … })
skin.adopt();
```

Render target: a document renders a `<style id>` (stable identity the boot path
reconciles by id); a shadow root renders an adopted constructable sheet.

## Traits

Reusable declaration sets, offered two ways:

```js
ass.traits.card   = { padding: '1rem', rad: '8px' };
ass.traits.shadow = { boxShadow: '0 1px 4px #0003' };

ass.sheets.ui = {
  '.card-a': { ...ass.traits.card, bg: '#111' },        // spread-native, no magic
  '.card-b': { use: ['card', 'shadow'], bg: '#222' },   // use-key, compiler inlines
};
```

`use` inlines the named traits ahead of the object's own declarations, which win on
conflict.

## Cascade layers

```js
ass.layers = ['tokens', 'base', 'components', 'utilities']; // -> @layer …;
ass.createSheet({ id: 'x', layer: 'components' });          // -> @layer components { … }
```

`adopt()` orders output as: layer declaration, then `:root` vars, then the
reduced-motion reset, then user sheets.

## Responsive

A nested `@<breakpoint>` key resolves to `@media (min-width: …)`; any other `@…`
key (`@media (…)`, `@supports`, `@container`) passes through verbatim.

```js
ass.breakpoints.tablet = '768px';

ass.sheets.layout = {
  '#content': {
    padding: '1rem',
    '@tablet': { padding: '2rem' },                    // -> @media (min-width: 768px)
    '@media (min-width: 1200px)': { maxWidth: '1100px' },
  },
};
```

## Motion

`motion` is a built-in alias for `transition`; `spring` / `smooth` / `snappy`
resolve to a `cubic-bezier()`. Turn on the global reduced-motion reset once.

```js
ass.reducedMotion = true;
ass.sheets.ui = { '.btn': { motion: 'transform 0.2s spring, opacity 0.15s' } };
// transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s;
// +  @media (prefers-reduced-motion: reduce) { … }
```

## Theming

A `[light, dark]` vars pair becomes `light-dark()`, and emitting any pair turns on
`color-scheme` so the browser honors it.

```js
ass.vars.surface = ['#ffffff', '#111111'];
ass.sheets.app   = { body: { bg: ass.vars.surface } }; // vars are referenced explicitly
// :root { color-scheme: light dark; --surface: light-dark(#ffffff, #111111); }
// body  { background-color: var(--surface); }
```

## Shades

`brand-a20` / `brand-d15` / `brand-l20` resolve to `color-mix()` when `brand` is a
known token or var (alpha / darken / lighten by percent):

```js
ass.vars.brand = '#5865f2';
ass.sheets.ui  = { '.tag': { bg: 'brand-a20', borderColor: 'brand-d15' } };
// background-color: color-mix(in srgb, var(--brand) 20%, transparent);
// border-color:     color-mix(in srgb, var(--brand) 85%, black);
```

Or call `shade()` directly: `shade('brand', { darken: 15 })`, `shade('brand', -15)`.

## Value types

`Num` is the numeric base (amount + unit + arithmetic); `Length`, `Angle`, `Time`
specialize it. `Color` is an opaque value with color-mix operations. `CssValue` is
the minimal base everything serializes through; `CalcValue` wraps a math expression.

```js
import { Num, Length, Color, clamp, min } from '@aufbau/stylescript';

Length.rem(1).add(Length.px(10)); // "calc(1rem + 10px)"
Length.px(10).scale(3);           // "30px"
new Num('10px').add('20px');      // "30px" (same unit evaluates directly)

Color('#000').alpha(0.5);         // "color-mix(in srgb, #000 50%, transparent)"
Color('red').darken(15);          // "color-mix(in srgb, red 85%, black)"
Color.hsl(300, 50, 25);           // "hsl(300 50% 25%)"

clamp(Length.rem(1), '2vw', Length.rem(3)); // "clamp(1rem, 2vw, 3rem)"
```

Any typed value drops straight into a style object or a template string.

## Shorthands

```js
import { icon, unset } from '@aufbau/stylescript';

icon('bx:search', { size: '1.5rem', color: 'currentColor' }); // mask-based icon styles
unset('margin', 'padding');                                    // { margin: 'unset', padding: 'unset' }
```

## Anti-flicker

Every adopted sheet writes its compiled css + content hash to `localStorage`
(`aufbau:stylescript:sheets|pages:v1`, see `cache.js`). `boot.js` — a classic,
blocking, first-in-`<head>` script — replays that cache as `<style>` elements before
the first paint, so a warm visit is styled while the module graph still loads:

```html
<script src="/aufbau/stylescript/boot.js"></script>
```
