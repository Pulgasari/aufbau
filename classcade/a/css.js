const PropertyAliases = { 
  bg: 'background-color', 
  fg: 'color', 
  
  mar: 'margin', 
  pad: 'padding'
};

const FunctionAliases = { 
  ld: 'light-dark' 
};

for (const [id, ref] of Object.entries(PropertyAliases)) cc.definePropAlias(id, ref);     
for (const [id, ref] of Object.entries(FunctionAliases)) cc.defineFnAlias(id, ref);
