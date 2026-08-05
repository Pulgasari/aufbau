# fp

`pipe` und `compose` sind das Herzstück der Datenverarbeitung in der Funktionalen Programmierung. Anstatt Funktionen tief ineinander zu verschachteln `(f(g(h(x))))`, erzeugst du eine lesbare Pipeline, durch die deine Daten fließen.

​Der Unterschied liegt nur in der Ausführungsrichtung:

​pipe (Left-to-Right): Liest sich wie ein Fließband. Daten gehen rein \rightarrow Schritt 1 \rightarrow Schritt 2 \rightarrow Ergebnis raus. (In der Praxis zu 90% bevorzugt, weil es unserer Leseseite entspricht).
​compose (Right-to-Left): Entspricht der mathematischen Notation f(g(x)). Der letzte Parameter wird zuerst ausgeführt.

## curry

```javascript
import { pipe } from './lib.js';

// 1. Standard JS functions (Data-Last parameter order)
const rawAdd      = (a, b) => a + b;
const rawMultiply = (a, b) => a * b;
const rawReplace  = (searchValue, replaceValue, str) => str.replace(searchValue, replaceValue);
const rawSlice    = (start, end, arr) => arr.slice(start, end);

// 2. Currying the functions
export const add      = curry(rawAdd);
export const multiply = curry(rawMultiply);
export const replace  = curry(rawReplace);
export const slice    = curry(rawSlice);

// Usage outside pipelines (both syntaxes work seamlessly!)
add(5, 10);    // 15 (Standard call)
add(5)(10);    // 15 (Curried call)

// 3. Building a pipeline with pre-configured functions
const processPrices = pipe(
  add(10),                 // Configured: adds 10 to whatever comes in
  multiply(1.19),          // Configured: applies 19% VAT
  val => val.toFixed(2)    // Final formatting
);

processPrices(100); 
// Calculation: (100 + 10) * 1.19 => "130.85"
```

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
