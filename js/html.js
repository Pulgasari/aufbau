// @aufbau/js/html.js

const RAW = Symbol.for('aufbau.raw');

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// quotes included, values are interpolated into attributes as often as into text
export const escapeHtml = value =>
  value == null ? '' : String(value).replace(/[&<>"']/g, char => ESCAPES[char]);

class Html {
  constructor (value) { this.value = value; }
  get [RAW] () { return true; }
  toString () { return this.value; }
}

export const isRaw = value => value?.[RAW] === true;

// nested html`` results and arrays of them pass through, everything else is escaped.
// null, undefined and false render as nothing, which makes `${cond && html``}` work.
const interpolate = value =>
    value == null || value === false ? ''
  : isRaw(value)                     ? value.toString()
  : Array.isArray(value)             ? value.map(interpolate).join('')
  : escapeHtml(value);

/**
 * tagged template that escapes every interpolated value.
 *
 *   html`<td>${row.name}</td>`
 *   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`
 *   html`${label && html`<span>${label}</span>`}`
 */
export const html = (strings, ...values) =>
  new Html(strings.reduce(
    (out, part, i) => out + part + (i < values.length ? interpolate(values[i]) : ''),
    ''
  ));

/** opt out of escaping. only for markup that is known to be trusted */
export const raw = value => new Html(value == null ? '' : String(value));

/**
 * attribute map -> raw attribute string, so attributes can be built conditionally
 * without hand-escaping. false, null, undefined and '' omit the attribute,
 * true renders it bare.
 *
 *   html`<a ${attrs({ href, target: external && '_blank', hidden: !visible })}>`
 */
export const attrs = map => raw(
  Object.entries(map ?? {})
    .filter(([, value]) => value !== false && value != null && value !== '')
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(' ')
);
