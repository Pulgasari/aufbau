export default {
  
  elements : { 
    mode: 'auto', // 'all' | 'auto' | false
  },

  // observe <link>/<style> and transform aufbau stylesheets client-side
  stylesheet : true,

  // data
  data : {
    layouts : ['mobile'],
    looks   : ['flat', 'rounded'],
    skins   : ['monochrome'],
    themes  : ['classic', 'oled', 'rainbow', 'zombie'],
  },

  // appearance
  font : ['Manrope'],
  css : {
    reset  : true,
    layout : false,
    look   : 'flat',
    skin   : 'monochrome',
    theme  : 'zombie',
  }
};
