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

##

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
