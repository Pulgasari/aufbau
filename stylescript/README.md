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

// custom-property vars -> emits :root { --brand: … } and reads back as var()
ass.vars.brand = '#5865f2';
String(ass.vars.brand); // "var(--brand, #5865f2)"

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

`adopt()` orders output as: layer declaration, then `:root` vars, then user sheets.

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
