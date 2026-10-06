import { Input } from './Input.js';

const PRESETS = {
  'input-bool'     : 'bool',
  'input-color'    : 'color',
  'input-country'  : 'country',
  'input-currency' : 'currency',
  'input-date'     : 'date',
  'input-datetime' : 'datetime',
  'input-duration' : 'duration',
  'input-email'    : 'email',
  'input-emoji'    : 'emoji',
  'input-font'     : 'font',
  'input-hotkey'   : 'hotkey',
  'input-icon'     : 'icon',
  'input-language' : 'language',
  'input-locale'   : 'locale',
  'input-number'   : 'number',
  'input-password' : 'password',
  'input-pattern'  : 'pattern',
  'input-phone'    : 'phone',
  'input-search'   : 'search',
  'input-slug'     : 'slug',
  'input-text'     : 'text',
  'input-time'     : 'time',
  'input-timezone' : 'timezone',
  'input-unit'     : 'unit',
  'input-url'      : 'url',
  'input-year'     : 'year',
};

// the class of every tag defined here
export const ELEMENTS = { 'input-value': Input };

for (const [tag, type] of Object.entries(PRESETS)) ELEMENTS[tag] = class extends Input { static type = type; };

// short texts as chips, the same as <input-text multiple>. before a chip is
// added, `transform` shapes it and `accept` (and `pattern`) may refuse it.
// `suggestions` and `suggest` offer texts while typing, a datalist on the field
ELEMENTS['input-chips'] = class extends Input {
  static attr = {
    multiple    : { type: Boolean, default: true },
    suggestions : String,   // a, b, c
  };

  static type = 'text';

  accept    = null;   // text -> true, false or the reason it is refused
  suggest   = null;   // text -> [text], or a promise of them
  transform = null;   // text -> text

  suggested = [];

  get suggestionList () {
    const fixed = String(this.getAttr('suggestions') ?? '').split(',').map(text => text.trim()).filter(Boolean);
    return [...new Set([...fixed, ...this.suggested])].filter(text => !this.values.includes(text));
  }

  // true, or why the text can not be a chip
  verdict (text) {
    const pattern = this.getAttr('pattern');
    if (pattern && !new RegExp(`^(?:${pattern})$`, 'u').test(text)) return 'does not match the pattern';
    const verdict = this.accept?.(text) ?? true;
    return verdict === false ? 'not accepted' : verdict;
  }

  add (text) {
    const raw  = String(text ?? '').replaceAll(',', ' ').trim();
    const next = this.normalize(this.transform ? this.transform(raw) : raw);
    if (!next) return this;

    const verdict = this.verdict(next);
    if (verdict !== true) {
      const field = this.part('input').node;
      field?.setCustomValidity(String(verdict));
      field?.reportValidity();
      this.emit('input-chips-refused', { reason: verdict, text: next });
      return this;
    }

    return super.add(next);
  }
};

for (const [tag, Element] of Object.entries(ELEMENTS)) Element.init(tag);

export const TAGS = Object.keys(ELEMENTS);
