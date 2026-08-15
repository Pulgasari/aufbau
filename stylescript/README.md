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

```javascript
import { ass } from './stylescript/core.js';

// 1. Direct Instantiation & Static Helpers
const bg = ass.Color('#000');
const primary = ass.Color.hsl(300, 50, 25);
const primaryString = ass.Color.hsl('300 50 25');

// 2. Chained Manipulations
const hoverBg = primary.darken(10);
const alphaBg = bg.alpha(0.5);

// 3. Length Operations
const padding = ass.Length.rem(1.5);
const doublePadding = padding.scale(2); // "3rem"

// 4. Type Checking
console.log(ass.isTypeOf(primary, ass.Color)); // true
console.log(ass.isTypeOf(padding, ass.Length)); // true
console.log(ass.isTypeOf('#000', ass.Color));   // false (raw string)

// 5. Native CSS Serialization inside style objects
const buttonStyle = {
  backgroundColor: primary,
  padding: padding,
  borderColor: hoverBg,
};

// ======= destructing ========
import { ass } from './stylescript/core.js';

// 1. Destructure classes & tools from 'ass'
const { Color, Length, isTypeOf } = ass;

const bg = Color('#000');
const primary = Color.hsl(300, 50, 25);
const padding = Length.rem(1.5);

// 2. Destructure static methods directly
const { hsl, rgb, oklch } = Color;
const { rem, px, vh } = Length;

const secondary = hsl(200, 80, 40);
const gap = rem(1);
const border = px(2);

// 3. Standalone type checks work without breaking
console.log(isTypeOf(primary, Color)); // true
```

Kleiner Feinschliff für `ass.isColor`:

​Damit auch `const { isColor } = ass;` ohne `this`-Kontext nicht bricht, definieren wir die Shorthands im Core einfach als Pfeilfunktionen.

So kannst du in Modulen wahlweise `import { Color, rem, isColor } from 'stylescript'` als Named Imports nutzen oder `ass` als Namespace-Objekt importieren und beliebig destrukturieren.

```javascript
// stylescript/core.js
import { Color }  from './types/color.js';
import { Length } from './types/length.js';

export const isTypeOf = (value, Type) => {
  if (value == null)         return false;
  if (value instanceof Type) return true;
  const prototype = Object.getPrototypeOf(Type);
  return prototype ? value instanceof prototype : false;
};

export const isColor  = (val) => isTypeOf(val, Color);
export const isLength = (val) => isTypeOf(val, Length);

export const ass = {
  Color,
  Length,
  isTypeOf,
  isColor,
  isLength,
};
```

```javascript
import { Length, Angle, Time, clamp, min } from './stylescript/types/index.js';

const { rem, px } = Length;
const { deg } = Angle;
const { ms } = Time;

// 1. Direct Same-Unit Math (JS evaluates directly -> "3rem")
const basePadding = rem(1);
const doublePadding = basePadding.add(rem(2)); 

// 2. Mixed-Unit Math (Auto-fallback to calc -> "calc(10px + 1.5rem)")
const mixedOffset = px(10).add(rem(1.5));

// 3. Scalar Multiplication (JS evaluates directly -> "30px")
const borderWidth = px(10).mul(3);

// 4. Responsive Clamp & Math Functions
const fontSize = clamp(rem(1), px(12).add(rem(2)), rem(3)); // "clamp(1rem, calc(12px + 2rem), 3rem)"
const containerWidth = min(rem(60), '100%');                // "min(60rem, 100%)"

// 5. Applied in Style Object
const cardStyle = {
  padding: doublePadding,
  margin: mixedOffset,
  fontSize: fontSize,
  transform: `rotate(${deg(45)})`,
  transition: `all ${ms(300)} ease-in-out`,
};
```

```javascript
import { Length } from './stylescript/types/length.js';
import { Num } from './stylescript/types/resolver.js';

const { px } = Length;

// 1. String-Parsing with typed methods
const a = px(10).add('1.5rem');      // "calc(10px + 1.5rem)"
const b = Num('10px').add('1.5rem'); // "calc(10px + 1.5rem)"

// 2. Same unit optimization via raw strings
const c = Num('10px').add('20px');   // "30px" (JS evaluates directly!)

// 3. Mixed types and numbers
const d = Num('100%').sub('20px');   // "calc(100% - 20px)"
const e = Num(10).add(5);            // "15px" (Uses default 'px' unit)

// 4. Auto-resolving inside style definitions
const cardStyle = {
  margin: Num('2rem').add('10px'),
  width: Num('100vw').sub('40px'),
};
```
