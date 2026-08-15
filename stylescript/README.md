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
