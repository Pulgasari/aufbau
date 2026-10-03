// <write-md>
// markdown, written in an <aufbau-writer> and shown by an <aufbau-reader>.
//
//   <write-md name="notes" value="# title"></write-md>
//   <write-md preview="side"></write-md>
//
// preview: toggle  a switch between writing and the preview (default)
//          side    both next to each other
//          none    the writer alone
//
// the value and the form behaviour are <aufbau-writer>'s.

import '../aufbau/AufbauReader.js';
import '../aufbau/AufbauWriter.js';

import { attrs, html }     from '../lib/html.js';
import { AufbauComponent } from '../base/AufbauComponent.js';

const DEBOUNCE = 150;

export class WriteMd extends AufbauComponent {

  static reflect = ['preview'];

  static attr = {
    counter     : Boolean,
    maxlength   : Number,
    minRows     : { type: Number, default: 6 },
    placeholder : 'markdown…',
    preview     : { type: String, default: 'toggle', values: ['none', 'side', 'toggle'] },
  };

  static control = 'aufbau-writer';
  static forward = ['counter', 'maxlength', 'minRows', 'placeholder'];

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

  render () {
    return html`
      <div role="tablist">
        <button type="button" role="tab" data-mode="write" aria-selected="true">write</button>
        <button type="button" role="tab" data-mode="preview" aria-selected="false">preview</button>
      </div>
      <div>
        <aufbau-writer ${attrs({ value: this.initialValue })}></aufbau-writer>
        <aufbau-reader></aufbau-reader>
      </div>
    `;
  }

  bind () {
    // the two tabs are no value of the component, they only switch what shows
    this.on('click', '[data-mode]', (event, button) => {
      const preview = button.dataset.mode === 'preview';
      this.states.toggle('preview', preview);
      for (const tab of this.querySelectorAll('[data-mode]')) tab.setAttribute('aria-selected', String(tab === button));
    });

    this.on(this.control, 'input', event => { if (event.target === this.control) this.schedulePreview(); });
    this.renderPreview();
  }

  schedulePreview () {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.renderPreview(), DEBOUNCE);
  }

  renderPreview () {
    this.reader?.setAttribute('raw', this.value || ' ');
  }

  onAttributeChange (name, oldValue, newValue) {
    super.onAttributeChange(name, oldValue, newValue);
    if (name === 'value') this.renderPreview();
  }

  onUnmount () { clearTimeout(this._timer); }
}

WriteMd.init('write-md');

export default WriteMd;
