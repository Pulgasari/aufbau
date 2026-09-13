# @aufbau/ass (Aufbau Style Sheets)

**Aufbau Style Sheets (ASS)** is a superset of CSS. It basically adds a little bit of sugar and integration of aufbau-packages related to the appearance of a website/webapp.

## overview

status: **v0.1** implements the four core constructs — `@default`, `@prop`,
`@value`, `@mixin` (incl. `use:` and class-as-mixin). everything below beyond
those (aufbau-props, `@aufbau-config`, `@aufbau-media`, themes, shade engine, the
service-worker/boot no-flash paths) is still spec, not built.

the engine is `parse -> transform -> serialize`, hand written and
zero-dependency. the core entry is environment-agnostic (string in, css string
out), so the same code runs in a build step and in a browser worker.

```javascript
import { compile } from '@aufbau/ass';
const css = compile(assSource);
```

value resolution is lookup-then-passthrough: any ordinary css that defines no
token is emitted unchanged, so ass is a strict superset. nesting is flattened
against the parent selector rather than emitted as native css nesting.

### offline / android apps

no network, no runtime dependency. for the capacitor apps the recommended path
is precompiling `.ass` to `.css` at build time (no runtime cost, no flash) and
shipping the plain css in `www/`. `@aufbau/ass/run` can also compile inline
`<style type="text/ass">` blocks at runtime for dev.

---

# philosophy

## we do love css, but ...

... when working with it, it soons becomes kinda redundant and messy.

## the 3-way-relationship

every rule is in the end a 3 way relationship: 
element/scope/target -> property -> value

```css
div { color: red; }
```

---

# additional at-rules

[@default](#)
[@mixin](#)
[@prop](#)
[@value](#)

in Planung:

```
@a11y
@config
```

## `@default`

(or maybe: `@def` `@define` `@preset`)

```css
/* :::::::::: DEFINE :::::::::: */
/* these become also available on 'padding-left' etc. */

@default gap, margin, padding {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}

@default color {
  brand: #008800;
}

/* :::::::::: USAGE :::::::::: */

.example {
  color: brand;
  gap: small;
}
```

```css
.example {
  color : #008800;
  gap   : 0.50rem;
}
```

## `@mixin`

```css
@mixin vert { 
  display   : flex; 
  flex-flow : column;

  > * { flex: 1 0 auto; }
}

body { @mixin: .vert; }
#app { @mixin: .vert; }
```

however any class-block could be used as a mixin as well. so one could use its good old utility classes right ahead.

```css
.vert { 
  display   : flex; 
  flex-flow : column;

  > * { flex: 1 0 auto; }
}
.bold { font-weight: bold; }

body { @mixin: .vert; }
#app { @mixin: .vert .bold; }
```

but to keep things simple: it applies the first block with that classname as identifier

## `@prop` and `@value`

because we are inside a selector 

the `@value` prefix tells the engine that the left side is a value which should be applied to the props on the rights side.

```css
.clean-button {
  @value #FFFF00 : background-color;
  @value red     : border-color color;
  @value unset   : margin padding;
}
```

```css
.clean-button {
  background-color : #FFFF00;
  border-color     : red;
  color            : red;
  margin           : unset;
  padding          : unset;
}
```

```css
<selector> { @value <value> : <property> }
```


now let's have a look on `@prop`:

```css
@prop font-size {
  header : 20px;
  main   : 16px;
  footer : 12px;
}
```

```css
@prop <property> { <selector> : <value> }
```

---

# aufbau-props

ASS provides several additional properties with an `aufbau-` prefix to make use of several aufbau packages.

[aufbau-filter](#aufbau-filter)
[aufbau-icon](#aufbau-icon)
[aufbau-pattern](#aufbau-pattern)
[aufbau-webfont](#aufbau-webfont)

## aufbau-filter

```css
div {
  aufbau-filter: glitch;
}
```

## aufbau-icon

```css
.search-btn {
  aufbau-icon : 'bx:search' size(1.5rem) color(brand-d30);
}

.close-btn {
  aufbau-icon : 'lucide:x';
}
```

## aufbau-pattern

```css
div {
  aufbau-pattern: grid;
}
```

## aufbau-webfont

```css
body {
  aufbau-webfont: "JetBrains Mono";
}
```


