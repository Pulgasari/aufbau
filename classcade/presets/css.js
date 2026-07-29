// presets/css.js

const cc = {};

const quickies = Object.entries({
  bg  : color => ({ backgroundColor: color }),
  fg  : color => ({ color: color }),
  opa : value => ({ opacity: value }),

  gap : value => ({ gap: value }),
  mar : value => ({ margin: value }),
  pad : value => ({ padding: value }),

  // layout
  block  : value => ({ display: 'block' }),
  flex   : value => ({ display: 'flex' }),
  grid   : value => ({ display: 'grid' }),
  hidden : value => ({ display: 'none' }),
  inline : value => ({ display: 'inline' }),

  //
  h : value => ({ height: value }),
  w : value => ({ width: value }),

  // typo
  bold      : value => ({ fontWeight: 'bold' }),
  uppercase : value => ({ textTransform: 'uppercase' }),
});

for (const [id, css] of quickies) {
  Object.assign(cc, cc.rule({ id, css }));
}

export default cc => {
    cc.method({
        id:"var",
        resolve(name){
            return `var(${name})`;
        }
    });

    cc.method({
        id:"calc",
        resolve(expression){
            return `calc(${expression})`;
        }
    });

};

/*
export default cc => {
  
  cc.rule ({ 
    id: 'bg', 
    css: color => ({ backgroundColor: color })
  });
  
  cc.rule ({ 
    id: 'color', 
    css: color => ({ color: color }) 
  });

  cc.rule ({ 
    id: 'opacity', 
    css: value => ({ opacity: value }) 
  });

  cc.rule ({ 
    id: 'block', 
    css: value => ({ display: 'block' }) 
  });

  cc.rule ({ 
    id: 'hidden', 
    css: value => ({ display: 'none' }) 
  });

  cc.rule ({ 
    id: 'inline', 
    css: value => ({ display: 'inline' }) 
  });

};
*/
