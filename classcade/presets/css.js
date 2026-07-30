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

// if 'body' is string   -> cc.rule({ id, css: v => ({ <string>: v }) })
// if 'body' is function -> cc.rule({ id, css: <function> })
// if 'body' is object   -> cc.rule({ id, css: v => (<object>) })
for (const [id, body] of quickies) {
  let obj = (switch (typeof body) {
    case 'string'   : return { id, css: v => ({ body: v }) };        
    case 'function' : return { id, css: body };
    case 'object'   : return { id, ...body };
  });
  Object.assign(cc, cc.addRule(obj));
}

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



