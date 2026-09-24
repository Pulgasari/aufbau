# css-config (testfeld, noch nicht eingebaut)

idee: elemente nicht nur per attribut, sondern auch per css konfigurieren.

```css
aufbau-toggle          { --look: switch; }
.settings aufbau-toggle { --look: checkbox; }
```

## befunde (chromium 141, getestet)

### `--` ist pflicht, beim property-namen

- unbekannte namen ohne `--` (`skeleton-color: red`, `aufbau-look: switch`) verwirft der parser. sie fehlen im cssom (`rule.style.cssText` leer) und in `getComputedStyle`
- `el.style.setProperty('aufbau-look', …)` wird ebenfalls verworfen
- `@property skeleton-color { … }` wird verworfen, `CSS.registerProperty({ name: 'skeleton-color' })` wirft `SyntaxError: Custom property names must start with '--'`
- eigene at-regeln (`@aufbau-media`) fehlen im cssom
- nur der rohe text eines `<style>`-elements behält sie. über `<link>` (nur per erneutem fetch) und adoptierte sheets kommt man nicht mehr ran, cascade und vererbung müsste man nachbauen. nicht praktikabel

### werte brauchen kein `--`

| `syntax` in `@property`         | ergebnis     |
| ---                             | ---          |
| `"classic \| oled \| soviet"`   | geht, der browser prüft die werte |
| `"<custom-ident>"`              | geht         |
| `"<ident>"`                     | abgelehnt    |
| `"<dashed-ident>"`              | abgelehnt    |

`<dashed-ident>` gibt es nur dort, wo die grammatik es vorsieht (`anchor-name: --box`, geht).

### was damit geht

- `if(style(--theme: soviet): red; else: …)` geht, auch pro element überschrieben
- ungültiger wert auf registriertem keyword-typ (`--look: banana`) → geerbter wert bzw. `initial-value`. **nicht** die vorige regel der cascade
- seiten-css setzt `--look` am host, das shadow-css reagiert:

  ```css
  /* static styles */
  :host { inline-size: if(style(--look: switch): 40px; else: 20px); }
  @container style(--look: switch) { [part~="thumb"] { … } }
  ```

- `@container style()` fragt nur vorfahren ab, nie das element selbst. am `:host` also `if()`, darunter beides
- js kann css-konfiguration beobachten: `transition: --look 1ms allow-discrete` auf registrierter keyword-property feuert `transitionrun` mit `propertyName: '--look'`

## mögliches konzept

- elemente registrieren ihre config-properties per `@property` mit keyword-syntax
- `inherits: false` für element-config (`--look`), damit verschachtelte elemente den wert der eltern nicht sehen. dann reicht der kurze name statt `--aufbau-look`
- vererbte tokens (`--skeleton-color` usw.) bleiben wie sie sind
- core bekommt einen style-observer (transition + `transitionrun`), der css-config in den element-zustand übernimmt. quasi `static reflect` rückwärts: `aufbau-toggle { --look: switch }` wirkt wie `look="switch"`, inkl. aria und `:state()`
- reihenfolge attribut vs. css klären (vorschlag: attribut gewinnt)

## offen

- firefox und safari ungetestet. `if()` gibt es bisher nur in chromium → im shadow-css zuerst `@container style()`, `if()` nur zusätzlich
- style-queries auf custom properties innerhalb von shadow dom in allen engines prüfen
- kosten des style-observers bei vielen elementen (index mit tausenden items)
