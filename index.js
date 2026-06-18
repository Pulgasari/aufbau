

// Helpers
let root = document.documentElement;
let prefixed = (str, prerix) => str.startsWith(prefix) ? str : (prefix + str);
let toWords        = str => str.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_.\s]+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean);
let toCamelCase    = str => toWords(str).map( (word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1)) .join('');
let toKebabCase    = str => toWords(str).join('-');

//
const definitions = new Map ();

export function define ({ key, target, type }) {
  key = toCamelCase(key);
  target ??= root;
  definitions.set( key, { target, type });
}
export function update ({ key, value, target }) {
  let { type } = definitions.get(key) ?? {};
  if (type === 'dataset')  updateDataset  ({ key, value, target });
  if (type === 'property') updateProperty ({ key, value, target });
}
export function updateProperty ({ key, value, target }) {
  key = toKebabCase(key);
  key = prefix(key, '--');
  (target || root).style.setProperty(key, value);
}
export function updateDataset ({ key, value, target }) {
  key = toCamelCase(key);
  (target || root).dataset[key] = value;
}




//



