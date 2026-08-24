# @aufbau/webfonts

web: [https://code.pulgasari.dev/aufbau/webfonts/](https://code.pulgasari.dev/aufbau/webfonts/)

## api

```javascript
import webfonts from '@aufbau/webfonts';

webfonts.apply('Manrope');
webfonts.load('Manrope');
webfonts.use('Manrope');
```

```javascript
// 1. Handpicked fonts from main entry
import { initWebfonts, applyFont } from '@aufbau/webfonts';

await initWebfonts(['manrope', 'jetbrains-mono']);
applyFont('manrope');
```

```javascript
// 2. Google fonts as submodule (isolated import)
import { loadGoogleFont } from '@aufbau/webfonts/google';

loadGoogleFont({
  family: 'Roboto',
  weights: [300, 400, 700]
});
```

## data
