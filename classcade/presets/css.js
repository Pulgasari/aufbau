export default cc => {
  
  cc.rule ({ 
    id: 'bg', 
    css: color => ({ background-color: color })
  });
  
  cc.rule ({ 
    id: 'color', 
    css: color => ({ color: color }) 
  });

  cc.rule ({ 
    id: 'opacity', 
    css: value => ({ opacity: value }) 
  });

};

export default cc => {

    cc.rule({

        id:"block",

        resolve(){

            return {

                display:"block"

            };

        }

    });

    cc.rule({

        id:"inline",

        resolve(){

            return {

                display:"inline"

            };

        }

    });

    cc.rule({

        id:"hidden",

        resolve(){

            return {

                display:"none"

            };

        }

    });

};
