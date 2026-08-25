# @aufbau/webfonts

web: https://aufbau.dev/webfonts/

## api

```javascript
import webfonts from '@aufbau/webfonts';

webfonts.apply('Manrope');
webfonts.load('Manrope');
webfonts.use('Manrope');
```

```javascript
// 1. Handpicked fonts from main entry
import webfonts from '@aufbau/webfonts';

await webfonts.load(['manrope', 'jetbrains-mono']);
webfonts.apply('manrope');
```

```javascript
// 2. Google fonts as submodule (isolated import)
import googleFonts from '@aufbau/webfonts/google';

googleFonts.load({
  family: 'Roboto',
  weights: [300, 400, 700]
});
```

## data

## examples

### ​1. App-Initialization (Globale Einrichtung beim Start)

​Das Laden von Handpicked-Fonts und Google Fonts direkt beim Anwendungsstart:

```javascript
import webfonts    from '@aufbau/webfonts';
import googleFonts from '@aufbau/webfonts/google';

async function setupApp() {

  // 2. Load primary catalog fonts (loads Manrope and JetBrains Mono)
  // First array item becomes the default primary font on :root
  await webfonts.init(['manrope', 'jetbrains-mono']);

  // 3. Load supplementary Google Fonts
  googleFonts.init([
    { family: 'Playfair Display', weights: [400, 700] },
    { family: 'Fira Code', weights: [400] }
  ]);
}

setupApp();
```

### 2. Dynamic Font Switcher (Live-Wechsel im UI)

​Schalten der Schriftart zur Laufzeit via Button-Click oder Design-Token-Picker:

```javascript
import webfonts from '@aufbau/webfonts';

const fontSelect = document.querySelector('#font-picker');

fontSelect.addEventListener('change', async (event) => {
  const selectedFont = event.target.value;

  // Ensure the font file is loaded before applying
  await loadFont(selectedFont);

  // Apply to root CSS variable --aufbau-font
  applyFont(selectedFont);
});
```

or in case one uses `@aufbau/runtime` (pure or as a kit):

```javascript
import aufbau, { dom } from '@aufbau/runtime';

dom.get('#font-picker').on('change', async (event) => {
  const selectedFont = event.target.value;

  // Ensure the font file is loaded before applying
  await aufbau.webfonts.load(selectedFont);

  // Apply to root CSS variable --aufbau-font
  aufbau.webfonts.apply(selectedFont);

});
```

### 3. Scoped Font Application (Schriften auf bestimmte Elemente begrenzen)
​
Anwenden einer Schriftart nicht auf :root, sondern auf einen bestimmten Container (z. B. einen Code-Editor oder eine Vorschau-Card):

```javascript
import { applyFont, loadFont } from '@aufbau/webfonts';

async function setupCodeEditor() {
  const editorEl = document.querySelector('.code-editor');

  // Load JetBrains Mono from catalog
  await loadFont('jetbrains-mono');

  // Apply CSS variable specifically to the editor container
  // Target CSS variable: --editor-font-family
  applyFont('jetbrains-mono', editorEl, '--editor-font-family');
}

setupCodeEditor();
```

### 4. Erweiterte Google Fonts (Variable Ranges & Italics)

​Google Fonts mit komplexe Rängen für Variable Fonts, Kursiv-Schnitten und Custom Displays:

```javascript
import { loadGoogleFont } from '@aufbau/webfonts/google';

// Load Inter with full variable weight range (100 to 900)
loadGoogleFont({
  family: 'Inter',
  weights: ['100..900'],
  display: 'swap'
});

// Load Roboto with explicit normal and italic cuts
loadGoogleFont({
  family: 'Roboto',
  weights: ['400', '400i', '700', '700i'],
  display: 'optional'
});
```

### 5. Progressive Loading / Skeleton State Handling

​Warten auf den Ladevorgang, um FOUT (Flash of Unstyled Text) zu vermeiden oder Loading-Spinner  auszublenden:

```javascript
import { loadFont, applyFont } from '@aufbau/webfonts';

async function loadHeroFont() {
  const heroSection = document.querySelector('.hero');
  heroSection.classList.add('is-loading');

  // Load font asynchronously
  const loadedFaces = await loadFont('vollkorn');

  if (loadedFaces && loadedFaces.length > 0) {
    applyFont('vollkorn', heroSection, '--hero-font');
    heroSection.classList.remove('is-loading');
  } else {
    // Fallback logic if font loading failed
    console.warn('Using system fallback font for hero section');
  }
}

loadHeroFont();
```

###

```javascript
import { init, apply } from '@aufbau/webfonts';

// 1. Single string (sets '--aufbau-font' on :root)
await init('manrope');

// 2. Single object with shortcut target
await init({ name: 'jetbrains-mono', target: 'mono' }); 
// Sets '--aufbau-font-mono' on :root

// 3. Mixed Array in init()
await init([
  'manrope',                                                    // default font on :root
  { name: 'jetbrains-mono', target: 'mono' },                   // --aufbau-font-mono on :root
  { name: 'vollkorn', target: 'serif', scope: '.article' },      // --aufbau-font-serif on .article
  { name: 'manrope', target: '--custom-header-font', scope: '#header' } // --custom-header-font on #header
]);

// 4. Flexible apply() calls
apply('jetbrains-mono', 'mono');                    // --aufbau-font-mono on :root
apply('jetbrains-mono', '--code-font');             // --code-font on :root
apply('jetbrains-mono', '#editor', 'code');         // --aufbau-font-mono on #editor
apply('jetbrains-mono', document.body, '--editor'); // --editor on <body>
```
