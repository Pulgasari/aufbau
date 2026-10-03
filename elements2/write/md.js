import '../aufbau/AufbauReader.js';
import '../aufbau/AufbauWriter.js';

import setAttr from '@domina/methods/setAttr.js';

import { AufbauElement } from '../base/AufbauElement.js';
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
      gap            : var(--aufbau-control-gap, 0.5em);

      > [role="tablist"] { align-self: flex-start; display: flex; }
      > div              { display: grid; gap: inherit; }

      &:not([preview="toggle"]) > [role="tablist"]           { display: none; }
      &[preview="none"] aufbau-reader                        { display: none; }
      &[preview="side"] > div                                { grid-template-columns: 1fr 1fr; }
      &[preview="toggle"]:state(preview) aufbau-writer       { display: none; }
      &[preview="toggle"]:not(:state(preview)) aufbau-reader { display: none; }
    }`;
  }

  get reader () { return this.querySelector('aufbau-reader'); }
  get writer () { return this.querySelector('aufbau-writer'); }

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
        <aufbau-writer ${attrs({ value: this.firstValue })}></aufbau-writer>
        <aufbau-reader></aufbau-reader>
      </div>
    `;
  }

  // after the first render, and again after a reconnect: a disconnect drops the listeners
  onMount  () { if (this.writer) this.bind(); }
  onRender () { this.bind(); }

  bind () {
    this.on('click', '[data-mode]', (event, button) => {
      const preview = button.dataset.mode === 'preview';
      this.states.toggle('preview', preview);
      for (const tab of this.querySelectorAll('[data-mode]')) tab.setAttribute('aria-selected', String(tab === button));
    });

    this.on(this.writer, 'input', event => { if (event.target === this.writer) this.schedulePreview(); });
    this.renderPreview();
  }

  sync () {
    const values = this.getAttr();
    setAttr(this.writer, Object.fromEntries(FORWARD.map(name => [name, values[name] ?? false])));
  }

  schedulePreview () {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.renderPreview(), DEBOUNCE);
  }

  renderPreview () {
    this.reader?.setAttribute('raw', this.value || ' ');
  }

  onAttributeChange (name, oldValue, newValue) {
    if (name !== 'value' || !this.writer) return;
    this.writer.value = newValue ?? '';
    this.renderPreview();
  }

  onUnmount () { clearTimeout(this._timer); }
}

WriteMd.init('write-md');

export default WriteMd;
