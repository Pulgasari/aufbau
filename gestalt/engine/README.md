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
