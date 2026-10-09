# engine

experimental.
work in progress.
do not touch it.
do not care about it.

## goal

ziel ist, die engine auf verschiedene arten nutzen zu können:

### by `<app-root>`

```html
<app-root>
  ...
  <div
    gestalt-engine-flow='grid 3x3'
    gestalt-engine-typo='uppercase'
  >
    ...
  </div>
  ...
</app-root>
```

### by css

```css
div {
  --gestalt-engine-flow: grid 3x3;
  --gestalt-engine-typo: uppercase;
}
```

## how it works

1. der observer erkennt die jeweiligen namespaces und extrahiert deren content und übergibt diesen an den jeweiligen parser.
2. dieser gibt ein objekt (mit data-attr oder custom-props) zurück, die der observer dann ans element bindet.
3. das css reagiert dann auf diese werte automatisch.

anmerkung: derart nötig ist das nur, weil css nicht auf substrings reagieren bzw . diese überhaupt ausleaen kann, ansonsten wäre das zeug schon css-only möglich.
