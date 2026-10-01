# ideas

not built, analysed. each one: what it would be, what it compiles to, what
speaks for and against it.

## shadow parts

`::part()` is the only way into a component's shadow tree, and it is awkward:
it cannot stand inside `:is()`, nothing may follow it but pseudo classes, and
the part names have to be known by heart. the skin lists every element × part
pair on its own because of the first point.

### a. the `>>` combinator

```
app-area[name="context"] >> sheet { margin-inline: small; }
:is(aufbau-dropdown, aufbau-picker) >> (trigger, listbox):hover { … }
```

- compiles to `::part(sheet)`, lists multiplied out into every pair
- `>>` is no css, so nothing collides; it reads as "into the shadow"
- a combinator expresses the relation, which is what `::part()` is
- the old, removed `>>>` (shadow piercing) looked alike, but meant "any depth":
  `>>` here is one level, exactly what `::part()` allows

### b. the `$` prefix

```
app-area[name="context"] $sheet { margin-inline: small; }
aufbau-picker $(trigger, listbox):hover { … }
```

- `$` = s = shadow. not valid in a css selector, so nothing collides either
- the same name in js: `static parts = ['scrim', 'sheet', 'handle']` gives
  `this.$scrim`, `this.$sheet`, `this.$handle` (getters on the shadow root,
  cached). one vocabulary for the part in css and in the class
- the registration also feeds ass: unknown part names are reported, a renamed
  part can keep an alias
- against: `$` means something else in two other places already. htx: `<$icon>`
  is a shorthand tag from a registry. signalStore: `state.$open` is a leaf's
  value. AufbauCore has `this.$` as a query helper. a third and fourth meaning
  of `$` is a lot to keep apart

### both

they do not exclude each other: `>>` as the relation, `$name` as the marker of
a part name. `app-area >> sheet` and `app-area $sheet` could compile alike. if
only one: `$` for the match with js, `>>` for the clarity of meaning.

`static parts` is worth having either way, independent of the selector syntax.

## a prefix selector: `aufbau-*`

css has no wildcard for tag names. ways to get one:

1. **expand at compile time** from a registry: `aufbau-*` becomes
   `:is(aufbau-button, aufbau-input, …)`. works for the tags ass knows (the
   elements' list, components' `COMPONENTS`), not generically. a long `:is()`
   costs nothing measurable in matching
2. **mark at runtime**: every AufbauCore adds a custom state, `aufbau-*`
   compiles to `:state(aufbau)`. generic for everything built on aufbau, one
   line in the base class. matches only after the upgrade, which is when the
   styles matter anyway
3. **truly generic** (any prefix, any library): not possible in css. an
   attribute selector on the tag name does not exist, `:defined` matches
   built-ins too

proposal: 2 for our own elements, 1 as the fallback where a registry exists.

## nested properties

```
div {
  margin : {
    -top  : 10px;
    -left : 20px;
  };
}
```

compiles to `margin-top: 10px; margin-left: 20px;`.

- sass has had this ("nested properties"), there without the dash:
  `font: { family: x; size: y; }`
- the dash makes the join visible and keeps `top` from reading as a property of
  its own: worth keeping
- logical properties fit well: `margin: { -block: 1rem; -inline-start: 2rem; }`
- parsing: a known property, a colon, then a block. native css nesting cannot
  mean that (a nested rule needs a selector, `margin:` followed by a block is no
  valid selector), so there is no ambiguity for ass's own parser
- tokens (`@default`) apply per longhand, they already know their longhands
  (longhands.js)
- against: one more nesting level for two lines; the gain is largest for long
  families (`grid-template-`, `border-inline-start-`, `animation-`)
- a related form for one value over several longhands: `margin-{top,left}: 10px`
