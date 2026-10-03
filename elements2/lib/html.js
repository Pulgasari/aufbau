const RAW = Symbol.for('aufbau.raw');

const ESCAPES = { 
  '&' : '&amp;', 
  '<' : '&lt;',
  '>' : '&gt;', 
  '"' : '&quot;', 
  "'" : '&#39;'
};

export const escapeHtml = value =>
  value == null ? '' : String(value).replace(/[&<>"']/g, char => ESCAPES[char]);

class Html {
  constructor (value) { this.value = value; }
  get [RAW] () { return true; }
  toString () { return this.value; }
}

export const isRaw = value => value?.[RAW] === true;

const interpolate = value =>
    value == null || value === false ? ''
  : isRaw(value)                     ? value.toString()
  : Array.isArray(value)             ? value.map(interpolate).join('')
  : escapeHtml(value);

export const html = (strings, ...values) =>
  new Html(strings.reduce(
    (out, part, i) => out + part + (i < values.length ? interpolate(values[i]) : ''),
    ''
  ));

export const raw = value => new Html(value == null ? '' : String(value));

export const attrs = map => raw(
  Object.entries(map ?? {})
    .filter(([, value]) => value !== false && value != null && value !== '')
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(' ')
);
