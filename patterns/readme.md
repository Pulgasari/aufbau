# @aufbau/patterns

```javascript
import { api, dots } from '@aufbau/patterns';

const element = document.getElementById('example');
api.apply(dots, element);
```

## usage with @aufbau/stylesheet

these are also built into @aufbau/stylesheet

```css
#example {
  aufbau-pattern: dots bg(transparent) fg(#FF0000) rotate(90deg);
}
```

## usage with @aufbau/kits

these are also built into any kit from @aufbau/kits

```javascript
import aufbau from '@aufbau/kits/preact-htm';

aufbau.dom.element('#example');

aufbau.setPattern('dots', {
  bg: 'transparent',
  fg: '#FF0000',
  rotate: '90deg',
});
```

or simply in the stylesheet:

```css
#example {
  aufbau-pattern: dots bg(transparent) fg(#FF0000) rotate(90deg);
}
```

## vanilla

```javascript
import api from '@aufbau/patterns';

const uri = api.toDataUri('dots', {
  bg: 'transparent',
  fg: '#FF0000',
  rotate: '90deg',
});

const element = document.getElementById('example');
element.style.backgroundImage  = `url('${uri}')`;
element.style.backgroundRepeat = 'repeat';
```
