const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const toDashed = (key) => key.startsWith('--') ? key : key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

class HtmlString {
  constructor (value) { this.value = value; }
  toString () { return this.value; }
}

const resolve = (value) =>
    value == null || typeof value === 'boolean' ? ''
  : value instanceof HtmlString                 ? value.value
  : Array.isArray(value)                        ? value.map(resolve).join('')
  : escapeHtml(value);

export const attr = (name, value) =>
    value == null || value === false ? new HtmlString('')
  : value === true                   ? new HtmlString(` ${name}`)
  : new HtmlString(` ${name}="${escapeHtml(value)}"`);

export const attrs = (map) =>
  new HtmlString(Object.entries(map).map(([name, value]) => attr(name, value).value).join(''));

export const classes = (...values) => {
  const list = [];

  const walk = (value) => {
    if (!value) return;
    if (typeof value === 'string') list.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (typeof value === 'object') {
      for (const [key, active] of Object.entries(value)) if (active) list.push(key);
    }
  };

  values.forEach(walk);
  return list.join(' ');
};

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

export const html = (strings, ...values) => {
  let result = strings[0];
  for (let index = 0; index < values.length; index++) result += resolve(values[index]) + strings[index + 1];
  return new HtmlString(result);
};

export const raw = (value) => new HtmlString(value == null ? '' : String(value));

export const styles = (map) => Object.entries(map)
  .filter(([, value]) => value != null && value !== false && value !== '')
  .map(([key, value]) => `${toDashed(key)}: ${value};`)
  .join(' ');

export const when = (condition, content, otherwise = '') => {
  const value = condition ? content : otherwise;
  return typeof value === 'function' ? value() : value;
};
