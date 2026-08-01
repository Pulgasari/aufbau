# info:
- die "webcomponents" heissen hier bewusst "elements"
- die files folgen namens-schema `AufbauElementName`
- pro file ein element 
- elemente werden exportiert als default

# todo

wenn dir was unklar ist, frag nach.

## schritt 1:

- wir säubern die `AufbauElement.js`
- clevere helfer für eventzeug: `on`, `off`, `emit`
- clevere helfer für children-refs: `$`, `$$`
- clevere helfer für attribute: `getAttributes`, `setAttributes`, `attr`

## schritt 2: 

- `AufbauConfig.js` das kann jetzt noch nix, aber vorbereitet

## schritt 3:

- wir räumen alle element-files auf und bauen sie nun konsequent mit den helfern
- es wird nie `@aufbau/kit` importiert sondern das jeweilige unter-packe (zb `@aufbau/import`)

## schritt 4:

die `index.js`:
- exportiert alle elemente
- exportiert ne methode für register all
- exportiert methode für autoloader

## schritt 5:

- wir erstellen saubere `jsr.json` und `package.json`

---

# code beispiele

```javascript
// vorher
const src    = this.getAttribute('src') || '';
const title  = this.getAttribute('title') || 'Unknown Title';
const artist = this.getAttribute('artist') || '';
const cover  = this.getAttribute('cover') || '';
const layout = this.getAttribute('layout') || 'card';

// nachher
const { artist, cover, layout = 'card', src, title = 'Unknown Title' } = this.getAttributes();
```

```javascript
// vorher
const isChecked       = this.hasAttribute('checked');
const isDisabled      = this.hasAttribute('disabled');
const isIndeterminate = this.hasAttribute('indeterminate');

// nachher
const { checked, disabled, indeterminate } = this.getAttributes(Boolean);
```

```javascript
// vorher
const step    = parseFloat(this.getAttribute('step')  || '1');
const current = parseFloat(this.getAttribute('value') || '0');
this.setValue(current + direction * step);

// nachher
const { step = 1, value = 0 } = his.getAttributes(Number);

```

```javascript
// vorher

// nachher

```

```javascript
// vorher

// nachher

```

```javascript
// vorher

// nachher

```









