# fp

`pipe` und `compose` sind das Herzstück der Datenverarbeitung in der Funktionalen Programmierung. Anstatt Funktionen tief ineinander zu verschachteln `(f(g(h(x))))`, erzeugst du eine lesbare Pipeline, durch die deine Daten fließen.

​Der Unterschied liegt nur in der Ausführungsrichtung:

​pipe (Left-to-Right): Liest sich wie ein Fließband. Daten gehen rein \rightarrow Schritt 1 \rightarrow Schritt 2 \rightarrow Ergebnis raus. (In der Praxis zu 90% bevorzugt, weil es unserer Leseseite entspricht).
​compose (Right-to-Left): Entspricht der mathematischen Notation f(g(x)). Der letzte Parameter wird zuerst ausgeführt.

## match

vorher:

```javascript
function processInputImperative(input) {
  if (input === null || input === undefined) {
    return 'Empty input';
  } else if (typeof input === 'string') {
    return input.trim().toUpperCase();
  } else if (typeof input === 'number' && Number.isInteger(input) && input % 2 === 0) {
    return input * 100;
  } else if (Array.isArray(input)) {
    return `Array with ${input.length} items`;
  } else {
    return 'Unknown format';
  }
}
```

Deklarativ mit FP Pattern Matching `[][]`:

```javascript
// Define rules as reusable [Predicate, Action] pairs
export const processInput = match([
  [ is.blank,       () => 'Empty input'],
  [ is.string,      str => str.trim().toUpperCase()],
  [ [number, even], num => num * 100],                  // [] = AND combination!
  [array,                    arr => `Array with ${arr.length} items`]
], () => 'Unknown format');                                       // Fallback handler

// Usage:
processInput(null);        // 'Empty input'
processInput('  hello ');  // 'HELLO'
processInput(4);           // 400
processInput([1, 2, 3]);   // 'Array with 3 items'
processInput(true);        // 'Unknown format'
```

Praxisbeispiel: API-Response Handler

```javascript
const handleApiResponse = match([
  [res => res.status === 200, res => res.json()],
  [res => res.status === 401, () => Redirect('/login')],
  [res => res.status === 404, () => ShowError('Not Found')],
  [res => res.status >= 500,  () => ShowError('Server Error')]
], () => ShowError('Unexpected status'));
```
