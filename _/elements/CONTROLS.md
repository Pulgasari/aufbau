# controls

## die drei achsen

jedes control benutzt dieselben drei achsen. sie bedeuten überall dasselbe.

| achse | bedeutet | werte |
| --- | --- | --- |
| `type` | **welche art wert** | `color` `date` `datetime` `email` `number` `password` `phone` `text` `time` `url` |
| `look` | **wie es aussieht** | `combobox` `radio` `segments` `switch` `checkbox` `button` `field` `stepper` `swatch` `dropzone` `list` `plain` |
| `range` / `multiple` | **wie viele werte** | boolean |

`type` beschreibt nie die darstellung, `look` nie den wert. daraus folgt:

- `<aufbau-input type='range'>` gibt es nicht — das ist `<aufbau-slider>`
- `<aufbau-input type='file'>` gibt es nicht — das ist `<aufbau-upload>`
- `value-type` gibt es nicht — der wertetyp heisst immer `type`

`phone` wird intern auf `tel` gemappt, `datetime` auf `datetime-local`.

---

## elemente

```html
<!-- datenelement, kein control. kind von picker -->
<aufbau-option value='de' label='Deutsch'>
<aufbau-option value='de' icon='circle-flags:de'>
<aufbau-option value='de' disabled>
<aufbau-option value='de' selected>

<!-- one-of-n, bei multiple n-of-n -->
<aufbau-picker>
<aufbau-picker look='combobox'>
<aufbau-picker look='combobox' searchable>
<aufbau-picker look='radio'>
<aufbau-picker look='segments'>
<aufbau-picker multiple>
<aufbau-picker src='/data/countries.yaml'>

<!-- boolean -->
<aufbau-toggle>
<aufbau-toggle look='switch'>
<aufbau-toggle look='checkbox'>
<aufbau-toggle look='button'>
<aufbau-toggle indeterminate>

<!-- ein wert -->
<aufbau-input>
<aufbau-input type='color'>
<aufbau-input type='color' look='swatch'>
<aufbau-input type='date'>
<aufbau-input type='datetime'>
<aufbau-input type='email'>
<aufbau-input type='number'>
<aufbau-input type='number' look='stepper'>
<aufbau-input type='password'>
<aufbau-input type='phone'>
<aufbau-input type='text'>
<aufbau-input type='time'>
<aufbau-input type='url'>

<!-- ein wert auf einer achse -->
<aufbau-slider>
<aufbau-slider type='number'>
<aufbau-slider type='number' range>
<aufbau-slider type='color'>
<aufbau-slider type='date'>
<aufbau-slider type='datetime'>
<aufbau-slider type='time'>
<aufbau-slider controls editable unit='ms'>

<!-- dateien -->
<aufbau-upload>
<aufbau-upload accept='image/*'>
<aufbau-upload accept='.pdf,.docx'>
<aufbau-upload multiple max-size='5242880'>
<aufbau-upload look='dropzone'>
<aufbau-upload look='button'>

<!-- mehrzeiliger text -->
<aufbau-writer>
<aufbau-writer autogrow min-rows='3' max-rows='12'>
<aufbau-writer counter maxlength='280'>

<!-- prosa, kein control -->
<aufbau-reader src='/docs/intro.md'>
<aufbau-reader raw='# titel'>

<!-- aktionen, kein control -->
<aufbau-dropdown label='optionen'>
```

## form-beteiligung

alle controls sind `formAssociated` und benutzen `ElementInternals`. mit einem
`name` tauchen sie in `FormData` auf, folgen `form.reset()`, greifen bei
`required` auf `:invalid` und werden von `getFormValues()` aus `@domina/core`
ohne zusatzcode gelesen.

```html
<form id="settings">
  <aufbau-picker name="lang" look="segments">
    <aufbau-option value="de">Deutsch</aufbau-option>
    <aufbau-option value="en">English</aufbau-option>
  </aufbau-picker>
  <aufbau-toggle name="darkmode" label="Darkmode"></aufbau-toggle>
  <aufbau-slider name="volume" type="number" min="0" max="100"></aufbau-slider>
  <aufbau-writer name="bio" counter maxlength="280"></aufbau-writer>
  <aufbau-upload name="avatar" accept="image/*"></aufbau-upload>
</form>
```

```javascript
new FormData(settings);            // enthält lang, darkmode, volume, bio, avatar
getFormValues(settings);           // dasselbe, als objekt
```

`multiple` beim picker und `<aufbau-upload>` liefern je einen `FormData`-eintrag
pro wert bzw. pro datei, wie ein natives multi-select oder multi-file-input.

---

## abgelöst

| vorher | jetzt |
| --- | --- |
| `<aufbau-checkbox>` | `<aufbau-toggle look='checkbox'>` |
| `<aufbau-combobox>` | `<aufbau-picker look='combobox'>` |
| `<aufbau-switch mode='buttons'>` | `<aufbau-picker look='segments'>` |
| `<aufbau-switch mode='dropdown'>` | `<aufbau-picker look='combobox'>` |
| `<aufbau-number>` | `<aufbau-input type='number' look='stepper'>` |
| `<aufbau-text>` | `<aufbau-reader>` |

---

## HTML, zum vergleich

```html
<input type='button'>
<input type='checkbox'>
<input type='color'>
<input type='date'>
<input type='datetime-local'>
<input type='email'>
<input type='file'>
<input type='hidden'>
<input type='image'>
<input type='month'>
<input type='number'>
<input type='password'>
<input type='radio'>
<input type='range'>
<input type='reset'>
<input type='search'>
<input type='submit'>
<input type='tel'>
<input type='text'>
<input type='time'>
<input type='url'>
<input type='week'>

<button>
<datalist>
<fieldset>
<form>
<label>
<legend>
<meter>
<optgroup>
<option>
<output>
<progress>
<select>
<textarea>
```
