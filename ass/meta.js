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
  outline : ['color', 'offset', 'style, 'width'],
  overlay : null,
  textEmphasis : ['color', 'position', 'style'],
};

overflow-anchor
overflow-block
overflow-clip-margin
overflow-inline
overflow-wrap
overflow-x
overflow-y
overflow (shorthand)

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

for (let sth of MARGIN) {
  let key  = 'scroll' + '-' + 'sth';
  let body = propsMap['scroll'];
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
