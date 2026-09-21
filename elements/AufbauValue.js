// <aufbau-value>
//
// a value that is only ever read: the <span class="date"> you would otherwise
// build by hand, with the coercion that goes with it. whatever goes in — an
// epoch number, an iso string, whatever the api handed you — comes out in one
// shape.
//
// `type` is the vocabulary the controls already speak (core/valueTypes.js), so
// the same value is written with <aufbau-input type="date"> and shown with
// <aufbau-value type="date">, and every type the controls learn is a type this
// can show. the icon per type comes from that same table.
//
//   <aufbau-value type="date">1776556800000</aufbau-value>
//   <aufbau-value type="date" format="relative" value="2026-04-20"></aufbau-value>
//   <aufbau-value type="time" icon>14:30</aufbau-value>
//   <aufbau-value type="url" icon copy>https://example.com</aufbau-value>
//
// on Temporal: nothing here needs it yet. parsing one instant and printing it is
// what Date and Intl are for, and Temporal is not in every browser. it would
// earn its place the day this does calendar arithmetic (add a month, a plain
// date with no zone attached) — the parse/print pairs are one table per type, so
// that is a swap rather than a rewrite.

// :::::: IMPORTS

import { AufbauElement, TYPE_NAMES, valueType } from './core/index.js';
import { attrs, html } from './core/html.js';
import { configKeys }  from './core/AufbauConfig.js';

// :::::: CONSTANTS

const TAG           = 'aufbau-value';
const COPY_FEEDBACK = 2000;

// types that are an instant rather than a string, so they render as <time>
const TIME_TYPES = new Set(['date', 'datetime', 'time']);

// an attribute is always a string, and a timestamp arrives as one. for the types
// that store a number, a bare integer IS that number — milliseconds since the
// epoch for `date` and `datetime`, since midnight for `time`. never seconds:
// guessing the unit from how many digits it has is the kind of help that is
// wrong once and then wrong in production
const NUMERIC = /^-?\d+$/;

// Intl's four date/time presets. anything else falls through to the machine form
const STYLES = ['short', 'medium', 'long', 'full'];

// a bare clock carries no date and no zone, so `long` and `full` — which print
// one — are read as `medium`
const CLOCK = { short: 'short', medium: 'medium', long: 'medium', full: 'medium' };

const INTL_OPTIONS = {
  date     : (style) => ({ dateStyle: style }),
  datetime : (style) => ({ dateStyle: style, timeStyle: CLOCK[style] }),
  time     : (style) => ({ timeStyle: CLOCK[style] }),
};

// largest first: a distance is named in the biggest unit it fills, which is the
// unit a person would use for it
const UNITS = [
  ['year'  , 31_536_000_000],
  ['month' ,  2_592_000_000],
  ['week'  ,    604_800_000],
  ['day'   ,     86_400_000],
  ['hour'  ,      3_600_000],
  ['minute',         60_000],
  ['second',          1_000],
];

// :::::: TIME

const pad = (value, length = 2) => String(value).padStart(length, '0');

// local wall clock rather than toISOString(): an hour past midnight in UTC+2 is
// still yesterday in utc, and the date someone reads has to be the date they are
// living in. this is why the machine forms are here and not taken from
// valueTypes.js, whose formats belong to <input>, which speaks utc for `date`.
const isoDate  = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const isoTime  = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const isoStamp = (date) => `${isoDate(date)}T${isoTime(date)}`;

// `time` is milliseconds since midnight, not an epoch — it only becomes a Date
// by hanging it on some local day, and only Intl ever needs it as one
const instantOf = (type, value) => type === 'time'
  ? new Date(1970, 0, 1, 0, 0, 0, value)
  : new Date(value);

function relative (date, locale) {
  const diff = date.getTime() - Date.now();
  const size = Math.abs(diff);
  const [unit, span] = UNITS.find(([, ms]) => size >= ms) ?? UNITS.at(-1);
  // numeric:'auto' is what turns "1 day ago" into "yesterday"
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(diff / span), unit);
}

// :::::: FORMAT

/** the value as the matching control would carry it — what `datetime` and copy want */
function machineText (type, value) {
  if (value == null) return '';
  if (type === 'date')     return isoDate (new Date(value));
  if (type === 'datetime') return isoStamp(new Date(value));
  if (type === 'time')     return isoTime (instantOf('time', value));
  return valueType(type).format(value);
}

/** the value as it is shown. `format` names a style, the machine form is the default */
function displayText (type, value, format, locale) {
  if (value == null) return '';

  if (INTL_OPTIONS[type] && format === 'relative' && type !== 'time')
    return relative(instantOf(type, value), locale);

  if (INTL_OPTIONS[type] && STYLES.includes(format))
    return new Intl.DateTimeFormat(locale, INTL_OPTIONS[type](format)).format(instantOf(type, value));

  if (type === 'number' && format === 'locale')
    return new Intl.NumberFormat(locale).format(value);

  return machineText(type, value);
}

// :::::: MAIN

export default class AufbauValue extends AufbauElement {
  static attr = {
    // the value. absent, the authored text content becomes it (see onMount)
    value  : String,
    type   : { type: String, default: 'text', values: TYPE_NAMES },

    // how it is written out. per type through the config too, so a page can say
    // <aufbau-config value-date-format="medium"> once (see formatName)
    format : String,
    locale : { type: String, config: true },

    // present and empty takes the type's own icon, a value names another one
    icon   : String,
    copy   : Boolean,
  };

  // the watchlist is otherwise built from the schema, which cannot know the
  // per-type format keys — without them a setConfig() at runtime would change
  // what this element reads without repainting it
  static observedConfig = [
    ...TYPE_NAMES.flatMap(type => configKeys(TAG, `${type}-format`)),
    ...configKeys(TAG, 'format'),
    ...configKeys(TAG, 'locale'),
  ];

  static styles = `
    aufbau-value {
      display: inline-flex;
      align-items: baseline;
      gap: var(--value-gap, 0.35em);
    }

    aufbau-value:not([value]) { display: none; }

    aufbau-value > .value-icon { align-self: center; }

    aufbau-value:is([type="date"], [type="datetime"], [type="time"], [type="number"], [type="year"]) > .value-text {
      font-variant-numeric: tabular-nums;
    }

    aufbau-value > .value-copy {
      align-self: center;
      display: inline-flex;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 0;
      cursor: pointer;
    }
  `;

  // :::::: VALUE

  parseValue (raw) {
    const type = this.getAttr('type');
    const text = String(raw ?? '').trim();
    if (TIME_TYPES.has(type) && NUMERIC.test(text)) return Number(text);
    return valueType(type).parse(raw);
  }

  formatValue (value) { return machineText(this.getAttr('type'), value); }

  /** the parsed value, in whatever shape its type stores (an epoch for `date`, ms since midnight for `time`) */
  get value () {
    const raw = this.getAttribute('value');
    return raw == null || raw === '' ? null : this.parseValue(raw);
  }

  set value (next) {
    this.setAttr({ value: next == null || next === '' ? false : this.formatValue(this.parseValue(next)) });
  }

  /** what is shown */
  get text () {
    const { type } = this.getAttr();
    try   { return displayText(type, this.value, this.formatName(), this.getAttr('locale') || undefined); }
    catch { return machineText(type, this.value); }   // a bad locale must not take the page with it
  }

  /** the value as a string, the same one the matching control would carry */
  get machine () { return this.formatValue(this.value); }

  // :::::: CONFIG

  /**
   * the format to use: the attribute first, then a config key for this type
   * (`value-date-format`), then one for all of them (`value-format`).
   */
  formatName () {
    const type = this.getAttr('type');
    return this.getConfig('format', '', [
      ...configKeys(this.tag, `${type}-format`),
      ...configKeys(this.tag, 'format'),
    ]);
  }

  /** the icon to show before the value, '' for none */
  iconName () {
    if (!this.hasAttr('icon')) return '';
    return this.getAttr('icon') || valueType(this.getAttr('type')).icon || '';
  }

  // :::::: LIFECYCLE

  onMount () {
    // the authored text content is the value: <aufbau-value type="date">1745…</aufbau-value>.
    // it is cleared before the attribute is set, because setAttr renders
    // synchronously and the clear would wipe that markup right back out
    const inline = this.textContent.trim();
    if (inline && !this.hasAttribute('value')) {
      this.textContent = '';
      this.setAttr({ value: inline });
    }

    // a re-connected element still holds the markup of its last life, which
    // update() would compare against and then skip
    this.invalidate();

    this.on('click', '.value-copy', (event, button) => this.copy(button));
  }

  onUnmount () { clearTimeout(this._copyTimer); }

  // :::::: RENDER

  render () {
    const { copy, type } = this.getAttr();
    const text = this.text;
    if (!text) return html``;

    const icon = this.iconName();

    // <time> is what an instant is in html, and `datetime` carries the value
    // itself — the one thing a relative or styled rendering throws away
    const body = TIME_TYPES.has(type)
      ? html`<time class="value-text" ${attrs({
          datetime : this.machine,
          title    : this.formatName() === 'relative' ? this.machine : false,
        })}>${text}</time>`
      : html`<span class="value-text">${text}</span>`;

    return html`
      ${icon && html`<aufbau-icon class="value-icon" icon="${icon}"></aufbau-icon>`}
      ${body}
      ${copy && html`
        <button type="button" class="value-copy" title="copy">
          <aufbau-icon icon="lucide:copy"></aufbau-icon>
        </button>`}
    `;
  }

  // :::::: CLIPBOARD

  /**
   * the machine form goes to the clipboard, not what is on screen: a date shown
   * as "yesterday" is worth nothing pasted anywhere else, and for every type
   * whose rendering loses nothing the two are the same string.
   */
  async copy (button) {
    const text = this.machine;

    try {
      await navigator.clipboard.writeText(text);

      const icon = button?.querySelector('aufbau-icon');
      icon?.setAttribute('icon', 'lucide:check');
      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => icon?.setAttribute('icon', 'lucide:copy'), COPY_FEEDBACK);

      this.emit('aufbau-value-copy', { value: text });
    }
    catch (error) { console.warn('[aufbau-value] clipboard copy failed:', error); }

    return this;
  }
}

AufbauValue.init();
