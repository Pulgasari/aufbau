# @aufbau/stylescript

## scratches

```javascript
import { StyleSheet, css } from 'stylescript';

const sheet = new StyleSheet('app-styles');

// Variant 1: Flattened Arrays (No Spreading required!)
sheet.define({
  '.card': [
    { display: 'flex', padding: '1rem' },
    { backgroundColor: '#111', color: '#fff' },
    { '&:hover': { opacity: 0.9 } }
  ]
});

// Variant 2: Method Chaining
sheet.define((builder) => {
  builder.rule('.btn', (r) => r
    .flex('row', 'center')
    .set({ padding: '0.5rem 1rem', borderRadius: '4px' })
  );
});

// Variant 3: Tagged Template Literal / CSS-String
sheet.define(css`
  .icon {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
`);

// Adopt directly into DOM via domina under the hood
sheet.adopt(document);
```

```javascript
import { defineTokens } from './stylescript/tokens.js';
import { shade, parseAufbauShade } from './stylescript/shade.js';
import { StyleSheet } from './stylescript/index.js';

// 1. Register Token Definitions
export const { tokens, toCSS: generateTokenCSS } = defineTokens({
  colors: {
    brand: '#5865f2',
    oled: ['#000000', '#ffffff'],
  },
  gap: {
    small: '0.5rem',
    big: '2.0rem',
  }
});

// 2. Build StyleSheet
const appSheet = new StyleSheet('theme-sheet');

// Inject Token Custom Properties into :root
appSheet.define(generateTokenCSS(':root'));

// Use Tokens & Shade Engine inside Rules
appSheet.define({
  'body': {
    backgroundColor: tokens.colors.oled.bg, // var(--colors-oled-bg)
    color: tokens.colors.oled.fg,           // var(--colors-oled-fg)
    gap: tokens.gap.big,                    // var(--gap-big, 2.0rem)
  },

  '.card': {
    // Generated via JS helper: color-mix(in srgb, var(--colors-brand, #5865f2) 20%, transparent)
    backgroundColor: shade(tokens.colors.brand, { alpha: 0.2 }),

    // Generated via JS helper: color-mix(in srgb, var(--colors-brand, #5865f2) 85%, black)
    borderColor: shade(tokens.colors.brand, { darken: 15 }),
  },

  '.badge': {
    // Aufbau String Notation (brand-a20)
    backgroundColor: parseAufbauShade('brand-a20', tokens),
  }
});

appSheet.adopt(document);
```

```javascript
// Result: { margin: 'unset', padding: 'unset', border: 'unset' }
unset('margin', 'padding', 'border')

// Also works with arrays
unset(['backgroundColor', 'color'])
```

```javascript
// Standard Iconify Icon with token color
icon('bx:search', { size: '1.5rem', color: shade('brand', { darken: 15 }) })

// Simple inline icon inheriting text color
icon('lucide:check')
```
