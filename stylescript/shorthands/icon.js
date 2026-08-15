// stylescript/shorthands/icon.js

/**
 * Generates icon mask styles for Iconify or custom SVG URLs.
 * 
 * @param {string} iconName - Icon identifier (e.g. 'bx:search', 'lucide:x') or full SVG URL
 * @param {Object} [options] - Icon configuration
 * @returns {Object} CSS Mask style object
 */
export function icon(iconName, options = {}) {
  const { size = '1em', color = 'currentColor' } = options;
  
  let url = iconName;
  
  // Resolve Iconify syntax 'set:name' (e.g. 'bx:search')
  if (!iconName.startsWith('http') && !iconName.startsWith('data:') && iconName.includes(':')) {
    const [prefix, name] = iconName.split(':');
    url = `https://api.iconify.design/${prefix}/${name}.svg`;
  }

  return {
    display: 'inline-block',
    width: size,
    height: size,
    backgroundColor: color,
    maskImage: `url("${url}")`,
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskImage: `url("${url}")`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: 'contain',
  };
}
