// aufbau/stylescript/index.js

import {
  defineTokens,
  Color,
  StyleSheet
} from './../index.js';


// 1. Define theme tokens for background and foreground
export const { tokens, toCSS: generateTokenCSS } = defineTokens({
  colors: {
    bg: Color('#0d0f12'),
    fg: Color('#f1f5f9'),
    accent: Color('#5865f2'),
  }
});

// 2. Instantiate main test stylesheet
const sheet = new StyleSheet('aufbau-test-styles');

// 3. Register root CSS variables
sheet.define(generateTokenCSS(':root'));

// 4. Apply styles to body and content container
sheet.define({
  'body': {
    backgroundColor: tokens.colors.bg,
    color: tokens.colors.fg,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    margin: 0,
    padding: '2rem',
    minHeight: '100vh',
  },

  '#content': {
    maxWidth: '800px',
    margin: '0 auto',
  },

  'h1, h2': {
    color: tokens.colors.accent,
    borderBottom: `1px solid ${Color(tokens.colors.fg).alpha(0.1)}`,
    paddingBottom: '0.3rem',
  }
});

// 5. Adopt stylesheet directly into the document via domina
sheet.adopt(document);
