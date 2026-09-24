// <aufbau-writer>
// multiline text control. the counterpart to <aufbau-reader>.
// the host is the field frame: the native <textarea>, then a footer with the
// counter and the copy/paste/clear actions when either is enabled.
//
// `look` is reserved as the axis a richer editing mode would arrive on
// (look="markdown"), the value api below stays the same either way.

import { actionButtons, bindActions, parseActions } from './core/actions.js';
import { AufbauControl } from './core/index.js';
import { dedent }        from './core/utils.js';
import { attrs, html }   from './core/html.js';
import { setAttr }       from '@domina/methods/setAttr.js';
import { setValue }      from '@domina/methods/setValue.js';

export default class AufbauWriter extends AufbauControl {
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

  // :state(full) marks a counter that reached maxlength
  // the children are the default value (static source), like the text of a
  // <textarea>. they stay untouched, the output is a <div> in the light dom
  static source = true;

  static styles = `aufbau-writer {
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
      gap             : var(--aufbau-control-gap, 0.5em);
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

  get field () { return this.$('textarea'); }

  // the contract with core/actions.js
  actionText   () { return this.field?.value ?? this.getAttribute('value') ?? ''; }
  actionTarget () { return this.getAttr('readonly') ? null : this.field; }

  onMount () {
    // the children are the starting value: <aufbau-writer>hello</aufbau-writer>
    if (!this.hasAttribute('value') && this.defaultValue) this.commit(this.defaultValue, { notify: false });

    this.on('input',  'textarea', (event, field) => { this.commit(field.value); this.grow(field); });
    this.on('change', 'textarea', (event, field) => this.commit(field.value));

    bindActions(this);
  }

  // like a <textarea>: the text content is the default value, the value attribute the current one
  captureDefaults () {
    this._defaultValue ??= dedent(this.sourceText) || (this.getAttribute('value') ?? '');
    return this;
  }

  // new children are a new default. an untouched field follows it, an edited one keeps its text
  onSourceChange () {
    const previous = this._defaultValue;
    this._defaultValue = dedent(this.sourceText);
    if ((this.getAttribute('value') ?? '') === previous) this.commit(this._defaultValue, { notify: false });
    else this.update();
  }

  /**
   * autogrow. measuring forces a layout, so it only runs when the text actually
   * changed, not on every sync pass.
   */
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

    // never write back into the field while the user is typing in it
    if (field !== document.activeElement) {
      setValue(field, value);
      this.grow(field);
    }

    setAttr(field, { readonly });

    // after super.sync(), which only handles the disabled host. read only keeps copy
    for (const button of this.$$('[data-action="paste"], [data-action="clear"]')) {
      button.disabled = this.isDisabled || readonly;
    }

    const counter = this.$('footer > output');
    if (counter) counter.textContent = maxlength ? `${value.length} / ${maxlength}` : String(value.length);

    this.states.toggle('full', Boolean(maxlength) && value.length >= maxlength);
  }
}

AufbauWriter.init();
