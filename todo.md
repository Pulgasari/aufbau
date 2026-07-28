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
