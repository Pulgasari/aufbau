# @aufbau/gestalt

the appearance of a page as a whole: palette, mode, theme, density, geometry,
look, layout and skin. the stylesheets that read them, and one controller to set
them.

```js
import { gestalt } from '@aufbau/gestalt';

await gestalt.set({ palette: 'oled', mode: 'dark', density: 'touch', geometry: 'round' });
gestalt.get('palette');     // 'oled'
gestalt.colors();           // { bg, fg, ink } as the browser computed them
await gestalt.palettes();   // the preset names of palettes.css
```

`@aufbau/api` hands the same controller on as `aufbau.gestalt`.

## files

| file           | what it is |
|----------------|------------|
| `index.js`     | the controller |
| `gestalt.css`  | the axes (`--palette`, `--scheme`, `--density`, `--geometry`, `--skin`) and the shorthands (`--bg`, `--fg`, `--ink`, …) |
| `palettes.css` | the palettes, a preset name or any css color to `--color-bg`, `--color-fg`, `--color-ink` |
| `themes.css`   | a theme to a palette and a skin |
| `skins/`       | the decoration of `@aufbau/elements`, adopted into `@layer aufbau.skin` |
| `looks/`       | look sheets, one at a time |
| `layouts/`     | layout sheets, one at a time |
| `animate/`     | keyframes, animations and their functions |
| `engine/`      | experimental, do not use |

`@aufbau/css/aufbau.css` imports `gestalt.css`, `palettes.css` and `animate/`.
