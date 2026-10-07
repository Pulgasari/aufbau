import './output-md.js';
import './write-text.js';

import setAttr      from '@domina/methods/setAttr.js';
import { debounce } from '@pulgasari/timing';

import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

const DEBOUNCE = 150;

// handed to the writer, which holds the value and is the form control
const FORWARD = ['counter', 'disabled', 'label', 'maxlength', 'minRows', 'name', 'persist', 'placeholder', 'readonly', 'required'];

export class WriteMd extends AufbauElement {

  static reflect = ['preview'];

  static attr = {
    counter     : Boolean,
    disabled    : Boolean,
    label       : String,
    maxlength   : Number,
    minRows     : { type: Number, default: 6 },
    name        : String,
    persist     : String,
    placeholder : 'markdown…',
    preview     : { type: String, default: 'toggle', values: ['none', 'side', 'toggle'] },
    readonly    : Boolean,
    required    : Boolean,
    value       : String,
  };

  // :state(preview) is the toggle showing the preview
  static styles () {
    return `write-md {
      display        : flex;
      flex-direction : column;
      gap            : --space(small);

      > [role="tablist"] { align-self: flex-start; display: flex; }
      > div              { display: grid; gap: inherit; }

      &:not([preview="toggle"]) > [role="tablist"]           { display: none; }
      &[preview="none"] output-md                        { display: none; }
      &[preview="side"] > div                                { grid-template-columns: 1fr 1fr; }
      &[preview="toggle"]:state(preview) write-text       { display: none; }
      &[preview="toggle"]:not(:state(preview)) output-md { display: none; }
    }`;
  }

  get reader () { return this.querySelector('output-md'); }
  get writer () { return this.querySelector('write-text'); }

  get value () { return this.writer?.value ?? this.getAttribute('value') ?? ''; }

  set value (value) {
    if (this.writer) this.writer.value = value;
    else this.setAttribute('value', value ?? '');
  }

  // only the first value goes into the markup, a new one would rebuild the writer
  get firstValue () { return this._firstValue ??= this.getAttribute('value') ?? ''; }

  render () {
    return html`
      <div role="tablist">
        <button type="button" role="tab" data-mode="write" aria-selected="true">write</button>
        <button type="button" role="tab" data-mode="preview" aria-selected="false">preview</button>
      </div>
      <div>
        <write-text ${attrs({ value: this.firstValue })}></write-text>
        <output-md></output-md>
      </div>
    `;
  }

  onConnected () {
    const preview = debounce(() => this.renderPreview(), DEBOUNCE);
    this.track(preview.cancel);

    this.$$('[data-mode]').onClick((event, button) => {
      this.states.toggle('preview', button.dataset.mode === 'preview');
      for (const tab of this.$$('[data-mode]')) tab.setAttribute('aria-selected', String(tab === button));
    });

    this.$('write-text').onInput(event => { if (event.target === this.writer) preview(); });

    if (this.writer) this.renderPreview();
  }

  onRender () { this.renderPreview(); }

  sync () {
    const values = this.getAttr();
    setAttr(this.writer, Object.fromEntries(FORWARD.map(name => [name, values[name] ?? false])));
  }

  renderPreview () {
    this.reader?.setAttribute('raw', this.value || ' ');
  }

  onAttributeChanged (name, oldValue, newValue) {
    if (name !== 'value' || !this.writer) return;
    this.writer.value = newValue ?? '';
    this.renderPreview();
  }
}

WriteMd.init('write-md');

export default WriteMd;
