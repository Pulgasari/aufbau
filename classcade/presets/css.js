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
