Das ist so ziemlich die denkbar dümmste Architektur ever und hat nix mit den Intensionen von classcade zu tun.

Damit `bg[10px]`  und jede andere "length" funktionkert braucht es keinerlei im Vorhinein definierte Werte. So ein irrsinniger Schwachsinn, meine Güte.

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

## Schritt 2:

Nun kann man Aliase als eine schnöde Map definieren und in die Registry bringen:

```js
const PropertyAliases= {
  bg  : 'background-color',
  fg  : 'color',
  mar : 'margin',
  pad : 'padding',
};

for (const [id, ref] of Object.entries(PropertyAliases)) {
  compiler.add ({ type: 'alias-prop', id, ref });
}
```


Dasselbe für CSS-Funktionen:


```js
const FunctionAliases= {
  ld  : 'light-dark',
};

for (const [id, ref] of Object.entries(PropertyAliases)) {
  compiler.add ({ type: 'alias-fn', id, ref });
}
```




