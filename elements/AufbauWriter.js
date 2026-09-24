// <aufbau-writer>
// multiline text control. the counterpart to <aufbau-reader>.
// the host is the field frame: the native <textarea>, then a footer with the
// counter and the copy/paste/clear actions when either is enabled.
//
// `look` is reserved as the axis a richer editing mode would arrive on
// (look="markdown"), the value api below stays the same either way.

import { actionButtons, bindActions, parseActions } from './core/actions.js';
import { AufbauControl } from './core/index.js';
import { attrs, html }   from './core/html.js';
import { toggleState }   from './core/utils.js';
import { setAttr }       from '@domina/methods/setAttr.js';
import { setValue }      from '@domina/methods/setValue.js';

export default class AufbauWriter extends AufbauControl {
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
  static styles = `aufbau-writer {
    display        : flex;
    flex-direction : column;

    > textarea {
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

    &[resize="none"] > textarea { resize: none; }
    &[resize="both"] > textarea { resize: both; }

    > footer {
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

  get field () { return this.$(':scope > textarea'); }

  // the contract with core/actions.js
  actionText   () { return this.field?.value ?? this.getAttribute('value') ?? ''; }
  actionTarget () { return this.getAttr('readonly') ? null : this.field; }

  onMount () {
    // authored text content is the initial value: <aufbau-writer>hello</aufbau-writer>.
    // it has to be cleared BEFORE the attribute is set, because setAttr renders
    // synchronously and the clear would wipe that markup right back out
    const inline = this.textContent.trim();
    this.textContent = '';

    if (inline && !this.hasAttribute('value')) {
      this._defaultValue = inline;
      this.setAttr({ value: inline });
    }

    this.on('input',  'textarea', (event, field) => { this.commit(field.value); this.grow(field); });
    this.on('change', 'textarea', (event, field) => this.commit(field.value));

    bindActions(this);
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

    const counter = this.$(':scope > footer > output');
    if (counter) counter.textContent = maxlength ? `${value.length} / ${maxlength}` : String(value.length);

    toggleState(this._internals, 'full', Boolean(maxlength) && value.length >= maxlength);
  }
}

AufbauWriter.init();
