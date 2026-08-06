// @aufbau/js/log.js

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

let threshold = LEVELS.info;

export const setLogLevel = (level) => {
  threshold = LEVELS[level] ?? threshold;
  return threshold;
};

export const createLogger = (scope) => {
  const label = `[${scope}]`;

  const write = (level) => (...args) => {
    if (LEVELS[level] < threshold) return;
    console[level](label, ...args);
  };

  return {
    scope,
    child : (suffix) => createLogger(`${scope}/${suffix}`),
    debug : write('debug'),
    error : write('error'),
    info  : write('info'),
    warn  : write('warn')
  };
};

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
