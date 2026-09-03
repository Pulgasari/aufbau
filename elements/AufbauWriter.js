// <aufbau-writer>
// multiline text control. the counterpart to <aufbau-reader>.
//
// `look` is reserved as the axis a richer editing mode would arrive on
// (look="markdown"), the value api below stays the same either way.

import { AufbauControl } from './core/index.js';
import { attrs, html } from './core/html.js';
import { setAttr } from '@domina/methods/setAttr.js';
import { setValue } from '@domina/methods/setValue.js';

export default class AufbauWriter extends AufbauControl {
  static attr = {
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

  static styles = `
    aufbau-writer { display: block; }

    aufbau-writer .aufbau-writer-wrapper {
      display: flex;
      flex-direction: column;
      inline-size: 100%;
    }

    aufbau-writer .writer-field {
      inline-size: 100%;
      margin: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1.4;
    }

    aufbau-writer .writer-field:focus { outline: none; }

    aufbau-writer .writer-counter {
      align-self: flex-end;
      font-size: 0.75em;
      line-height: 1;
      opacity: 0.65;
      font-variant-numeric: tabular-nums;
    }
  `;

  get field () { return this.$('.writer-field'); }

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
    const lower = minRows * lineHeight + padding;
    const upper = maxRows ? maxRows * lineHeight + padding : Infinity;
    const wanted = Math.min(upper, Math.max(lower, field.scrollHeight));

    field.style.height    = `${wanted}px`;
    field.style.overflowY = field.scrollHeight > wanted ? 'auto' : 'hidden';
    return this;
  }

  render () {
    const { counter, look, maxlength, placeholder, resize, rows, spellcheck } = this.getAttr();

    return html`
      <div class="aufbau-writer-wrapper look-${look}">
        <textarea class="writer-field" ${attrs({
          maxlength,
          placeholder,
          rows,
          spellcheck : String(spellcheck),
          style      : `resize: ${resize}`,
        })}></textarea>
        ${counter && html`<span class="writer-counter" aria-live="polite"></span>`}
      </div>
    `;
  }

  sync () {
    super.sync();

    const field = this.field;
    if (!field) return;

    const value = this.getAttribute('value') ?? '';

    // never write back into the field while the user is typing in it
    if (field !== document.activeElement) {
      setValue(field, value);
      this.grow(field);
    }

    setAttr(field, { readOnly: this.getAttr('readonly') });

    const counter = this.$('.writer-counter');
    if (counter) {
      const { maxlength } = this.getAttr();
      counter.textContent = maxlength ? `${value.length} / ${maxlength}` : String(value.length);
      counter.classList.toggle('is-full', Boolean(maxlength) && value.length >= maxlength);
    }
  }
}

AufbauWriter.init();
