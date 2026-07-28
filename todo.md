# todo

## @aufbau/import

- [ ] Import von Poo
- [ ] Import von ReScript
- [ ] Pseudo-Import (falls man versehentlich aufbau-import nutzt) für css, js json + Warnung in Console ???
 
## @aufbau/shapeshift

- [ ] aus der define/usw. logik/methodik in `@aufbau/kit/index.js` konzipieren

## @aufbau/stylesheet

- [x] multi-deklaration ermöglichen: `@aufbau gap, margin, padding {`
- [ ] integration von `@aufbau color` und `@aufbau-colors` mit `light-dark()`
- [x] at-rule: `@aufbau-config`
- [ ] at-rule: `@aufbau-include`
- [x] at-rule: `@aufbau-trait`
- [ ] property: `aufbau-animate`
- [x] property: `aufbau-colors`
- [x] property: `aufbau-icon`
- [ ] property: `aufbau-pattern`
- [x] property: `aufbau-webfont`


---

# brainstorming

- möglichkeit zur on-the-fly image-compression + caching ?
- stylesheet: iwas mit clamp
- stylesheet: iwas mit scrollbars

```css
.button {
  /* Setzt transition-property, duration, timing-function */
  aufbau-motion: transform 0.2s spring, opacity 0.15s ease;
}

.button {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

# APIs

## 1. CSSOM (CSS Object Model)

Die grundlegende JavaScript-API zum Lesen und Verändern von Stylesheets.
Wofür?
- Stylesheets auslesen
- Regeln hinzufügen/löschen
- CSS-Eigenschaften ändern

Beispiele:

```
document.styleSheets
stylesheet.cssRules
CSSStyleRule
CSSStyleDeclaration
```

## 2. CSS Typed OM

Eine moderne, typisierte Alternative zum klassischen CSSOM.

```javascript
// Anstatt
element.style.width = "100px";
// schreibt man
element.attributeStyleMap.set("width", CSS.px(100));
```

Vorteile:
- keine Stringparsing-Probleme
- Einheiten bleiben erhalten
- schneller
- besser für Animationen

Klassen:
```
StylePropertyMap
CSSUnitValue
CSSKeywordValue
CSSMathSum
CSSMathProduct
CSSMathMin
CSSMathMax
CSSMathClamp
CSSNumericValue
```

## 3. CSS Properties & Values API (Houdini)

Erlaubt eigene CSS-Properties zu registrieren.

Dadurch werden Custom Properties animierbar.

```css
@property --progress {
    syntax: "<number>";
    inherits: false;
    initial-value: 0;
}
```

```javascript
CSS.registerProperty(...)
```

## 4. CSS Painting API (Paint Worklet)

Teil von Houdini.

Man kann eigene Hintergründe zeichnen.

```css
background: paint(myPainter);
```

```javascript
registerPaint(...)
```

Verwendung:
- Muster
- Noise
- Raster
- Effekte

## 5. CSS Layout API (Layout Worklet)

Eigene Layout-Algorithmen entwickeln.

Beispiele:
- Masonry
- Magazine Layout
- Flow Layouts

Noch kaum implementiert.

## 6. CSS Animation Worklet

Animationen unabhängig vom Main Thread.

Ideal für:

- Scrollanimationen
- flüssige Animationen

Wird teilweise von moderneren APIs ersetzt.

## 7. CSS Typed OM Geometry Interfaces

Arbeitet mit:
```
DOMRect
DOMMatrix
DOMPoint
```

für Transformationen.

## 8. Constructable Stylesheets

Stylesheets als JavaScript-Objekte.

```javascript
const sheet = new CSSStyleSheet();

sheet.replaceSync(`
div {
    color:red;
}
`);

document.adoptedStyleSheets = [sheet];
```

Ideal für:
- Web Components
- Shadow DOM





