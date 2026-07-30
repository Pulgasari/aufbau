// presets/css.js

const cc = {};

const quickies = Object.entries({
  bg  : 'background-color',
  fg  : 'color',
  opa : 'opacity',

  gap : 'gap',
  mar : 'margin',
  pad : 'padding',

  ff  : 'font-family',
  tt  : 'text-transform',

  // layout
  block  : { display: 'block' },
  flex   : { display: 'flex' },
  grid   : { display: 'grid' },
  hidden : { display: 'none' },
  inline : { display: 'inline' },

  //
  h : 'height',
  w : 'width',

  // typo
  bold      : { fontWeight: 'bold' },
  uppercase : { textTransform: 'uppercase' },
});

// these need also "type: 'rule'"
for (const [a,b] of quickies) cc.add(a,b);

/*
export default cc => {
  cc.method({
    id: "var",
    css: function (name){ return `var(${name})`; } 
  });

  cc.rule ({ 
    id: 'bg', 
    css: color => ({ backgroundColor: color })
  });
};
*/



