**
 * Logs a group of key-value pairs with customizable options.
 * @param {Array<[string, any]>} entries - Array of [label, value] pairs.
 * @param {Object} options - Configuration object.
 */
const groupedLog1 = ( entries=[], options={} ) => {
  let { name = 'Log Group', color = '#00adb5', collapsed = false } = options;
  let groupMethod = collapsed ? 'groupCollapsed' : 'group';
  console[groupMethod](name);
  entries.forEach(([label, value]) => {
    console.log(
      `%c${label}:`, 
      `font-weight: bold; color: ${color};`, 
      value
    );
  });
  console.groupEnd();
};
/**
 * Logs a group of key-value pairs with high flexibility for entry formats.
 * @param {Array} entries - Can be [[l,v]], [{label, value, color}], or [value].
 * @param {Object} options - Configuration object (name, color, collapsed).
 */
function groupedLog( entries=[], options={} ){
  let { name = 'Log Group', color = '#00adb5', collapsed = false } = options;
  let groupMethod = collapsed ? 'groupCollapsed' : 'group';
  // Output
  console[groupMethod](name);
  entries.forEach( entry => {
    let label = '', value = null, itemColor = color;
    // CASE 1: Array [label, value]
    if (Array.isArray(entry)) [label, value] = entry;
    // CASE 2: Object {label, value, color}
    else if (typeof entry === 'object' && entry !== null) {
      label     = entry.label || '';
      value     = entry.value;
      itemColor = entry.color || color;
    } 
    // CASE 3: Raw Value
    else value = entry;
    // Log
    console.log(
      `%c` + (label ? `${label}:` : ''),
      `font-weight: bold; color: ${itemColor};`, 
      value
    );
  });
  console.groupEnd();
};
