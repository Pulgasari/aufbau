// @aufbau/elements2/input/types
// what a value is. one file per type, each a plain object:
//
//   input        the native <input type> of a field
//   icon         the leading icon of a field
//   look         the look drawn when the author asks for none
//   actions      the buttons of a field: copy, paste, clear, reveal
//   placeholder  the placeholder when the author gives none
//   parse        attribute text -> value in its type
//   format       value in its type -> attribute text
//   normalize    typed text -> its canonical form, when the field is left
//   axis         a numeric axis, for steppers and sliders:
//                { bounds, step, toNumber (value), fromNumber (number, previous) }
//   steppable    false where an axis has no meaningful step (color)
//   list         the values come from a list: { entries (host, locale) }
//   attributes   further attributes the type reads, observed on every input-*
//   setup        (host, on) behavior beyond a value, e.g. the search event

import bool     from './bool.js';
import color    from './color.js';
import country  from './country.js';
import currency from './currency.js';
import date     from './date.js';
import datetime from './datetime.js';
import duration from './duration.js';
import email    from './email.js';
import font     from './font.js';
import hotkey   from './hotkey.js';
import language from './language.js';
import locale   from './locale.js';
import number   from './number.js';
import password from './password.js';
import phone    from './phone.js';
import search   from './search.js';
import slug     from './slug.js';
import text     from './text.js';
import time     from './time.js';
import timezone from './timezone.js';
import unit     from './unit.js';
import url      from './url.js';
import year     from './year.js';

export const TYPES = {
  bool, color, country, currency, date, datetime, duration, email, font, hotkey, language,
  locale, number, password, phone, search, slug, text, time, timezone, unit, url, year,
};

/** every further attribute some type reads, as schema entries */
export const TYPE_ATTRIBUTES = Object.fromEntries(
  Object.values(TYPES).flatMap(type => type.attributes ?? []).map(name => [name, String])
);

export const typeOf = name => TYPES[name] ?? text;
