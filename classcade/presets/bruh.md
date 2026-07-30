Das ist so ziemlich die denkbar dümmste Architektur ever und hat nix mit den Intensionen von classcade zu tun.

Damit `bg[10px]`  und jede andere "length" funktioniert, braucht es keinerlei im Vorhinein definierte Werte. So ein irrsinniger Schwachsinn, meine Güte.

Nochmal neu:

## Schritt 1:

Von Haus aus soll ALLES bereits gehen, weil im ERSTEN SCHRITT ist die Syntax von **classcade** `prop[value]` gleichbedeutend mit **css** `prop: value;` – ohne das irgendwas geprüft werden muss etc.

```html
<div classcade='background[black] padding-top[calc(5px + 2px)] fill[10deg]'>...<div>
```

daraus wird:

```css
div { 
  background: black;
  padding-top: calc(5px + 2px);
  fill: 10deg; /* ist natürlich ungültig,a aber juckt das classcade? */
}
```

Und das bleibt auch so. (So bringt's halt -noch- nix...)

## Schritt 2:

Nun können wir Aliase für Properties als eine schnöde Map definieren und in die Registry bringen:

```js
const PropertyAliases = {
  bg  : 'background-color',
  fg  : 'color',
  mar : 'margin',
  pad : 'padding',
};

for (const [id, ref] of Object.entries(PropertyAliases)) {
  compiler.add ({ type: 'alias-prop', id, ref });
}
```

Dasselbe für Aliase von CSS-Funktionen:

```js
const FunctionAliases = {
  ld  : 'light-dark',
};

for (const [id, ref] of Object.entries(PropertyAliases)) {
  compiler.add ({ type: 'alias-fn', id, ref });
}
```

Und schon ist dies möglich:

```html
<div classcade='bg[ld(white black)]'>...<div>
```

daraus wird:

```css
div { 
  background: light-dark(white black);
}
```

Und jetzt bietet **classcade** schon einen Vorteil...

## Schritt 3

Nun könnte man so Shorthands definieren:

```js
const Shorthands = {
  block     : { prop: 'display' , value: 'block' },
  stickyTop : [{ prop: 'position', value: 'sticky' }, { prop: 'top', value: 0 }],
  // und so weiter
};

for (const [id, ref] of Object.entries(Shorthands)) {
  // ...
}
```

Anmerkungen:

1. Die genaue Syntax, wie man das intern handlet, ist dann zu schauen.

2. Grundsätzlich sollte halt alles normalisiert werden und in der echten RegistryMap als `id` + `object` landen.
- Und das Object enthält halt jeweils auch ne `type/kind`-Angabe (`alias-prop`, `alias-fn` usw.).
- Und für sowas sollten wir vllt noch einen/mehrere SpecResolver/Normalizer oder sowas bauen, der in der Lage ist, so ziemlich jede halbwegs naheliegendes Definitionsformat zu kapieren (`{ prop: 'display' , value: 'block' }` oder `'display: block'` oder `'position: sticky; top: 0;'` odrr gar `bg[transparent]` würde er verstehen sobald es die alias gibt usw),



