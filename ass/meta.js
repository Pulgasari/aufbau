// meta.js

const variantsOfPropByPrefixWithSameStruct = {
  gap    : ['column', 'row'],
  height : ['max', 'min'],
  width  : ['max', 'min'],
};

const variantsOfPropBySuffixWithSameStruct = {
  margin  : ['bottom', 'left', 'right', 'top', 'block', 'inline'],
  padding : ['bottom', 'left', 'right', 'top', 'block', 'inline'],
};

const subPropsmap = {
  outline      : ['color', 'offset', 'style, 'width'],
  overflow     : ['anchor', 'block', 'clip-margin', 'inline', 'wrap', 'x', 'y'],      
  overlay      : null,
  textEmphasis : ['color', 'position', 'style'],
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
  overlay  : null,
  outline  : null,
  padding  : { unit: 'px' },
  rx       : null,
  ry       : null,
  scale    : null,
  right    : { unit: 'px' },
  textEmphasis : null,
  top      : { unit: 'px' },
  width    : { unit: 'px' },
  zIndex   : { unit: false },
};

for (let sth of variantsOfPropBySuffixWithSameStruct['margin']) {
  let prop = 'scroll';
  let body = propsMap[prop];
  let key  = prop + '-' + sth;
  Object.assign(propsMap, { [key]: body });
}

for (let sth of variantsOfPropBySuffixWithSameStruct['padding']) {
  let prop = 'scroll';
  let body = propsMap[prop];
  let key  = prop + '-' + sth;
  Object.assign(propsMap, { [key]: body });
}

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

/*
scroll-margin-block-end
scroll-margin-block-start
scroll-margin-block (shorthand)
scroll-margin-bottom
scroll-margin-inline-end
scroll-margin-inline-start
scroll-margin-inline (shorthand)
scroll-margin-left
scroll-margin-right
scroll-margin-top
scroll-margin (shorthand)

= scroll + margin
= scroll + padding
*/
