# @aufbau/webfonts

web: https://aufbau.dev/webfonts/

the handpicked font collection. a font is loaded through the FontFace api and
applied as a custom property, so css decides where it is used. the catalogue is
`data.js`, generated from `handpicked.txt` (`npm run generate:webfonts`).

## api

the contract is shared with `@aufbau/filters` and `@aufbau/patterns`:

```javascript
import { apply, remove, update, use, load, list } from '@aufbau/webfonts';

await apply('manrope');                                   // --aufbau-font on :root
await apply('#editor', 'jetbrains-mono');                 // mono fonts default to --aufbau-font-mono
await apply('.article', 'vollkorn', { role: 'serif' });   // --aufbau-font-serif on .article
await apply('#header', 'lexend', { role: '--header-font' });

await update(':root', { fallback: 'system-ui' });         // every font on :root, new options
remove('.article', { role: 'serif' });                    // one role, or all without it

await load('vollkorn');   // only the files, resolves false when no face loaded
list();                   // [{ id, name, category }, …], the full entries as `data`
```

- the target may be left out, it is the root element then
- `role` is a key of `ROLES` (`body`, `code`, `heading`, `mono`, `sans`, `serif`) or any custom property
- the property is set even when loading failed, the fallback of the font takes over then
- `configure({ baseUrl })` points the files to another host

`use(id, options)` gives a `Font`, one font bound to its options:

```javascript
const mono = use('jetbrains-mono', { role: 'code' });

mono.family();          // "'JetBrains Mono', monospace"
await mono.load();
await mono.apply('#editor');
```

`init()` loads and applies a list at once, what `@aufbau/api` boots with:

```javascript
await init(['manrope', { id: 'jetbrains-mono' }, { id: 'vollkorn', role: 'serif', target: '.article' }]);
```

## google fonts

a separate entry, nothing of it is loaded with the main one:

```javascript
import { loadGoogleFont, initGoogleFonts } from '@aufbau/webfonts/google';

loadGoogleFont({ family: 'Inter', weights: ['100..900'] });
initGoogleFonts(['Roboto', { family: 'Playfair Display', weights: [400, 700] }]);
```
