import bool     from './bool.js';
import color    from './color.js';
import country  from './country.js';
import currency from './currency.js';
import date     from './date.js';
import datetime from './datetime.js';
import duration from './duration.js';
import email    from './email.js';
import emoji    from './emoji.js';
import font     from './font.js';
import hotkey   from './hotkey.js';
import icon     from './icon.js';
import language from './language.js';
import locale   from './locale.js';
import number   from './number.js';
import password from './password.js';
import pattern  from './pattern.js';
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
  bool, color, country, currency, date, datetime, duration, email, emoji, font, hotkey, icon,
  language, locale, number, password, pattern, phone, search, slug, text, time, timezone, unit,
  url, year,
};

export const TYPE_ATTRIBUTES = Object.fromEntries(
  Object.values(TYPES).flatMap(type => type.attributes ?? []).map(name => [name, String])
);

export const typeOf = name => TYPES[name] ?? text;
