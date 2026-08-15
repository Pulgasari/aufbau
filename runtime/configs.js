const x = {
  // 'auto' = lazy autoloader, elements are fetched when they appear in the dom
  // 'all'  = eagerly register every element up front
  // false  = do not touch @aufbau/elements at all
  elements : { mode: 'auto' },

  // observe <link>/<style> and transform aufbau stylesheets client-side
  stylesheet : true,

  // data
  layouts : ['mobile'],
  looks   : ['flat', 'rounded'],
  skins   : ['monochrome'],
  themes  : ['classic', 'oled', 'rainbow', 'zombie'],
};

export default x;
