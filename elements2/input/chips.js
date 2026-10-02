// <input-chips>
// a list of short values, typed one by one and shown as chips: 'red,green'.
// enter or the separator adds what was typed, backspace in the empty field
// takes the last one back, a click on a chip removes it.
//
//   <input-chips name="tags" value="red,green"></input-chips>
//   <input-chips name="mails" separator=";"></input-chips>
//
// the value is one string, joined with the separator. a hidden <aufbau-input>
// carries it, so the form sees one control.

import '../aufbau/AufbauButton.js';
import '../aufbau/AufbauInput.js';

import { attrs, html }     from '../core/html.js';
import { AufbauComponent } from '../core/AufbauComponent.js';

export class InputChips extends AufbauComponent {

  static attr = {
    placeholder : 'add…',
    separator   : ',',
    unique      : { type: Boolean, default: true },
  };

  static control = ':scope > aufbau-input[data-carrier]';

  static styles () {
    return `input-chips {
      align-items : center;
      display     : flex;
      flex-wrap   : wrap;
      gap         : var(--aufbau-control-gap, 0.5em);

      > aufbau-input[data-carrier] { display: none; }
      > aufbau-input:not([data-carrier]) { flex: 1 1 8em; }
    }`;
  }

  get entry () { return this.querySelector(':scope > aufbau-input:not([data-carrier])'); }

  get list () {
    const { separator } = this.getAttr();
    return String(this.value ?? '').split(separator).map(item => item.trim()).filter(Boolean);
  }

  render () {
    return html`
      <aufbau-input type="text"></aufbau-input>
      <aufbau-input type="text" data-carrier ${attrs({ value: this.initialValue })}></aufbau-input>
    `;
  }

  bind () {
    const entry = this.entry;
    this.mute(entry);

    this.on(entry, 'keydown', event => {
      const { separator } = this.getAttr();
      if (event.key === 'Enter' || event.key === separator) {
        event.preventDefault();
        this.add(entry.value);
      }
      else if (event.key === 'Backspace' && !entry.value) this.removeAt(this.list.length - 1);
    });

    // what is left in the field counts once it is left
    this.on(entry, 'focusout', () => this.add(entry.value));

    this.on('click', '[data-chip]', (event, chip) => this.removeAt(Number(chip.dataset.chip)));
  }

  sync () {
    super.sync();
    this.entry?.setAttribute('placeholder', this.getAttr('placeholder') ?? '');
    this.renderChips();
  }

  add (text) {
    const { separator, unique } = this.getAttr();
    const items = String(text ?? '').split(separator).map(item => item.trim()).filter(Boolean);
    if (this.entry) this.entry.value = '';
    if (!items.length) return;

    const list = [...this.list, ...items];
    this.commit(unique ? [...new Set(list)] : list);
  }

  removeAt (index) {
    const list = this.list;
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    this.commit(list);
  }

  commit (list) {
    this.control?.commit(list.join(this.getAttr('separator')));
    this.renderChips();
  }

  // the chips sit before the entry field, rebuilt only when the list changed
  renderChips () {
    const entry = this.entry;
    if (!entry) return;

    const list = this.list;
    const key  = list.join('\n');
    if (key === this._chipsKey) return;
    this._chipsKey = key;

    for (const chip of this.querySelectorAll(':scope > [data-chip]')) chip.remove();
    entry.before(...list.map((item, index) => {
      const chip = document.createElement('aufbau-button');
      chip.dataset.chip = index;
      chip.setAttribute('icon', 'lucide:x');
      chip.setAttribute('variant', 'ghost');
      chip.setAttribute('aria-label', `remove ${item}`);
      chip.textContent = item;
      return chip;
    }));
  }
}

InputChips.init('input-chips');

export default InputChips;
