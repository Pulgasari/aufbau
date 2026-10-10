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

### by js

```js
import 'gestalt/prototype.js';

const $div = document.querySelector('div');

$div.gestalt.flow = 'grid 3x3';
$div.gestalt.typo = 'uppercase';
```

## how it works

1. der observer erkennt die jeweiligen namespaces und extrahiert deren content und übergibt diesen an den jeweiligen parser.
2. dieser gibt ein objekt (mit data-attr oder custom-props) zurück, die der observer dann ans element bindet.
3. das css reagiert dann auf diese werte automatisch.

anmerkung: 
- derart nötig ist das nur, weil css nicht auf substrings reagieren bzw . diese überhaupt ausleaen kann, ansonsten wäre das zeug schon css-only möglich.
- bzgl. der festen werte wäre es theoretisch rein über ein class-system möglich

---

# the problem with css

on the one hand css is extremly powerful and flexible and contains lots of great APIs. but on the other hand its also flawed.

und auch die neueren css-features sind ebenso zweischneidig – einerseits toll, andererseits fehlt dann doch irgendwas.

- container-queries: nice, aber beziehen sich nicht auf den host
- custom functions: nice, aber ermöglichen keine substrings
- attr(): nice, aber auch kein parsing von dynamischen teil-strings möglich
- [attr-selector]: nice, aber bei komplexeren sachen extrem redundant
- styles-queries: nice aber auch schnell sehr redundant
- if/else: nice, aber redundant, nicht dynamisch genug
