import { actionButtons, bindActions, parseActions } from '../lib/actions.js';
import { AufbauElement, withControl, withSource }   from '@aufbau/element';
import { dedent }                                   from '../lib/dedent.js';
import { attrs, html }                              from '../lib/html.js';
import { setAttr }                                  from '@domina/methods/setAttr.js';
import { setValue }                                 from '@domina/methods/setValue.js';

export default class WriteText extends withSource(withControl(AufbauElement)) {
  static reflect = ['look', 'resize'];

  static attr = {
    actions     : { type: String, default: 'copy paste clear' },
    autogrow    : { type: Boolean, default: true },
    counter     : Boolean,
    look        : { type: String, default: 'plain', values: ['plain'] },
    maxRows     : Number,
    maxlength   : Number,
    minRows     : { type: Number, default: 2 },
    placeholder : String,
    resize      : { type: String, default: 'vertical', values: ['none', 'vertical', 'both'] },
    rows        : Number,
    spellcheck  : { type: Boolean, default: true },
  };


  static styles = `write-text {
    display: block;

    > div {
      display        : flex;
      flex-direction : column;
    }

    > div > textarea {
      background  : none;
      border      : 0;
      color       : inherit;
      font        : inherit;
      inline-size : 100%;
      line-height : 1.4;
      margin      : 0;
      resize      : vertical;

      &:focus { outline: none; }
    }

    &[resize="none"] > div > textarea { resize: none; }
    &[resize="both"] > div > textarea { resize: both; }

    > div > footer {
      align-items     : center;
      display         : flex;
      gap             : --space(small);
      justify-content : flex-end;

      > output {
        font-size            : 0.75em;
        font-variant-numeric : tabular-nums;
        line-height          : 1;
        margin-inline-end    : auto;
        opacity              : 0.65;
      }

      > button {
        align-items : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        font        : inherit;
        margin      : 0;
        padding     : 0;
      }
    }
  }`;

  get field () { return this.$('textarea').node; }

  // the contract with lib/actions.js
  actionText   () { return this.field?.value ?? this.getAttribute('value') ?? ''; }
  actionTarget () { return this.getAttr('readonly') ? null : this.field; }

  onConnected () {
    if (!this.hasAttribute('value') && this.defaultValue) this.commit(this.defaultValue, { notify: false });

    this.on('input',  'textarea', (event, field) => { this.commit(field.value); this.grow(field); });
    this.on('change', 'textarea', (event, field) => this.commit(field.value));

    bindActions(this);
  }

  captureDefaults () {
    this._defaultValue ??= dedent(this.sourceText) || (this.getAttribute('value') ?? '');
    return this;
  }

  onSourceChange () {
    const previous = this._defaultValue;
    this._defaultValue = dedent(this.sourceText);
    if ((this.getAttribute('value') ?? '') === previous) this.commit(this._defaultValue, { notify: false });
    else this.update();
  }

  grow (field = this.field) {
    if (!field || !this.getAttr('autogrow')) return this;
    if (field.value === this._grownFor) return this;
    this._grownFor = field.value;

    const { maxRows, minRows } = this.getAttr();
    const styles     = getComputedStyle(field);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const padding    = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);

    field.style.height = 'auto';
    const lower  = minRows * lineHeight + padding;
    const upper  = maxRows ? maxRows * lineHeight + padding : Infinity;
    const wanted = Math.min(upper, Math.max(lower, field.scrollHeight));

    field.style.height    = `${wanted}px`;
    field.style.overflowY = field.scrollHeight > wanted ? 'auto' : 'hidden';
    return this;
  }

  render () {
    const { counter, maxlength, placeholder, rows, spellcheck } = this.getAttr();
    const actions = parseActions(this.getAttr('actions'));

    return html`
      <textarea ${attrs({ maxlength, placeholder, rows, spellcheck: String(spellcheck) })}></textarea>
      ${(counter || actions.length) && html`
        <footer>
          ${counter && html`<output aria-live="polite"></output>`}
          ${actionButtons(actions)}
        </footer>
      `}
    `;
  }

  sync () {
    super.sync();

    const field = this.field;
    if (!field) return;

    const { maxlength, readonly } = this.getAttr();
    const value = this.getAttribute('value') ?? '';

    if (field !== document.activeElement) {
      setValue(field, value);
      this.grow(field);
    }

    setAttr(field, { readonly });

    this.$$('[data-action="paste"], [data-action="clear"]').attr({ disabled: this.disabled || readonly });
    this.$('footer > output').text(maxlength ? `${value.length} / ${maxlength}` : String(value.length));

    this.states.toggle('full', Boolean(maxlength) && value.length >= maxlength);
  }
}

WriteText.init();
