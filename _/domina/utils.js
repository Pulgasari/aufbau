// utils.js

export { arrayfied, isArray, isElementish, isFn, isFragment, isNullish, isObject, isString } from 'https://pulgasari.github.io/aufbau/utils/is.js';

export const
isDate   = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))),
isEDO    = v => isObject(v) && (v.tag || v.tagName),
isEmpty  = v => v === '' || v === null || v === undefined,
isHTML   = v => isString(v) && v.trim().startsWith('<'),
isIdLike = v => v.charCodeAt(0) === 35 && v.indexOf(' ') === -1 && v.indexOf('.') === -1,
isDings  = el => el.type === 'checkbox' || el.type === 'radio',
isMulti  = el => el.tagName === 'SELECT' && el.multiple,
isURL    = v => isString(v) && v.includes('://');

const pad = n => String(n).padStart(2, '0');

// Gibt Date oder null zurück. Reine Zahlen gelten NICHT als Datum,
// sonst wird aus "2020" ein Jahr und aus "5" der 5. Januar 2001.
export const parseDate = v => {
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v ?? '').trim();
  if (!s || !isNaN(Number(s))) return null;

  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);   // dd.mm.yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  const d = new Date(s);
  return isNaN(d) ? null : d;
};

export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Lokal formatieren – toISOString() würde je nach Zeitzone einen Tag verschieben
export const toDateInput = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toNum = v => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

// Fisher-Yates, in place
export const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
