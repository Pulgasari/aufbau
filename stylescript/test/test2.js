// test2.js

import ASS from './../index.js';
const { defineTokens, Color, StyleSheet } = ASS;

export const stylesheet = new ASS.StyleSheet('layout');

stylesheet += ({
  'body': {
    backgroundColor: '#0d0f12',
    color: '#f1f5f9',
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
    color         : Color('#ff0000').alpha(0.25),
    borderBottom  : `1px solid currentColor`,
    paddingBottom : '0.3rem',
  }
});

// =============================================
// ansatz 2

import { controller: ass } from '@aufbau/stylescript';

// define aliases for property-names
// - single or multiple at once
// - re-assignment overrides
ass.aliases.bg = 'background-color';
ass.aliases.fg = 'color';
ass.aliases = {
  fs  : 'font-size',
  rad : 'border-radius',
};

ass.tokens.cc = 'currentColor';

ass.sheets.layout = ass.createSheet({ id: 'layout' , layer: 'base' });
ass.sheets.skin   = ass.createSheet({ id: 'skin'   , layer: 'base' });
ass.sheets.typo   = ass.createSheet({ id: 'typo'   , layer: 'base' });

ass.sheets.layout += ({
  'body': {
    backgroundColor: '#0d0f12',
    color: '#f1f5f9',
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
    color         : Color('#ff0000').alpha(0.25),
    borderBottom  : `1px solid cc`,
    paddingBottom : '0.3rem',
  }
});




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
    backgroundColor: '#0d0f12',
    color: '#f1f5f9',
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
