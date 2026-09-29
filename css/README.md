# @aufbau/css

```md
functions.css
palettes.css
themes.css
tokens.css
```

## shorthand props

```css
/* with shorthands */
div {
  --bg  : black;
  --fg  : white;
  --ink : red;
}

/* without shorthands */
div {
  background-color : black;
  color            : white;
  accent-color     : red;
}
```

## functions.css

custom functions for the design system. chromium only for now, a browser without them drops the declaration, so a plain value in front stays the fallback:

```css
color: var(--accent);
color: --darker(var(--accent));
```

parameters default to the tokens (`--bg`, `--fg`, `--accent`, `--unit`, `--ratio`, …), each with a fallback of its own, so the functions work before `tokens.css` is there and follow a theme once it is.
