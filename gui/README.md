# @aufbau/gui

spec-driven ui-controls. 

a **spec** maps field keys to descriptors.

`render()` emits the matching `aufbau-*` controls as dom-elements or an html-string.

`readValues()` reads typed values back out of a rendered container.

## install

```
deno add jsr:@aufbau/gui
```

## spec

```javascript
const spec = {
  glitch : { type: 'boolean',  label: 'Glitch', default: true },
  speed  : { type: 'duration', label: 'Speed', min: '0.2s', max: '5s', step: '0.1s', default: '2s' },
  angle  : { type: 'angle',    label: 'Angle' },
  preset : { type: 'text',     label: 'Preset', values: [['cyber', 'Cyber'], 'live'], look: 'segments' },
};
```

a descriptor's `type` picks the control:

| type | control |
|---|---|
| `boolean` | `aufbau-toggle` |
| `integer`, `number` | `aufbau-slider` (number) |
| `angle` | `aufbau-slider` (0..360 deg) |
| `duration` | `aufbau-slider` (unit-carrying value) |
| `year` | `aufbau-input` (stepper) |
| `color` | `aufbau-input` (swatch) |
| `date`, `datetime`, `time`, `email`, `password`, `phone`, `text`, `url` | `aufbau-input` |

a `values` array turns any field into an `aufbau-picker` regardless of type.
options are bare (`'live'`) or `[value, label]` pairs. `look`, `min`, `max`,
`step`, `unit` and `default` ride through when set.

## api

```javascript
import { render, field, readValues } from '@aufbau/gui';

// dom (default): returns a container element (or a fragment when wrap is false)
const panel = render(spec, {
  values   : { speed: '1.5s' },
  wrap     : 'div',
  onChange : (values, name) => console.log(name, values),
});
document.body.append(panel);

// read the current values back, typed per spec
const values = readValues(panel, spec); // { glitch: true, speed: '1.5s', angle: 0, preset: 'cyber' }

// html string (dependency-free, e.g. at build time or server side)
const html = render(spec, { format: 'html' });

// a single field
const one = field('speed', spec.speed, '2s');            // dom element
const oneHTML = field('speed', spec.speed, '2s', { format: 'html' });
```

`render` element mode wires `onChange` to `change` and `input`, resolving the
changed field name off the nearest named control (composite controls like
`aufbau-picker` bubble from an inner unnamed element).

## layout

- `control.js` — spec entry -> `{ tag, attrs, options? }` (pure, no dom)
- `html.js` — html-string output (pure, no dom, no `@domina`)
- `element.js` — dom output via `@domina/methods`
- `read.js` — typed readback from a rendered container
- `index.js` — `render` / `field` dispatch + `readValues`
