// meta.js

const subPropsmap = {
  margin  : ['bottom', 'left', 'right', 'top', 'block', 'inline'],
  padding : ['bottom', 'left', 'right', 'top', 'block', 'inline'],

  height : ['max', 'min'],
  width  : ['max', 'min'],

  gap : ['column', 'row'],
};

const propsMap = {
  // ASS
  colors  : null,
  pattern : null,
  shader  : null,
  webfont : null,
  // CSS
  border   : null,
  bottom   : { unit: 'px' },
  flex     : null,
  fontSize : { unit: 'px' },
  gap      : { unit: 'px' },
  height   : { unit: 'px' },
  left     : { unit: 'px' },
  margin   : { unit: 'px' },
  opacity  : { unit: null },
  outline  : null,
  padding  : { unit: 'px' },
  right    : { unit: 'px' },
  top      : { unit: 'px' },
  width    : { unit: 'px' },
  zIndex   : { unit: false },
};

export const defaultUnits = {
  fontSize     : 'px',
  width        : 'px',
  height       : 'px',
  minWidth     : 'px',
  maxWidth     : 'px',
  minHeight    : 'px',
  maxHeight    : 'px',
  margin       : 'px',
  marginTop    : 'px',
  marginRight  : 'px',
  marginBottom : 'px',
  marginLeft   : 'px',
  padding      : 'px',
  paddingTop   : 'px',
  paddingRight : 'px',
  paddingBottom: 'px',
  paddingLeft  : 'px',
  gap          : 'px',
  rowGap       : 'px',
  columnGap    : 'px',
  borderRadius : 'px',
  top          : 'px',
  right        : 'px',
  bottom       : 'px',
  left         : 'px',
  borderWidth  : 'px',
  opacity      : '',
  zIndex       : '',
  flex         : ''
};
